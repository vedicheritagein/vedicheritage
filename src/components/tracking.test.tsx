import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Catalogue } from '../lib/payments';

/**
 * What reaches Meta, and when.
 *
 * Separate from checkout.test.tsx because the pixel ID is read once, when
 * lib/pixel.ts is first evaluated - so switching tracking on means resetting
 * the module registry and importing the components again, which no other test
 * in the suite wants to pay for.
 *
 * The point being guarded is the timing. `InitiateCheckout` has to mean the
 * buyer reached the payment page, not that they opened the form and wandered
 * off; if the two ever merge again, every conversion rate in Events Manager
 * silently halves and nothing else in the suite notices.
 */

const CATALOGUE: Catalogue = {
  currency: 'USD',
  products: [
    {
      sku: 'ticket-general',
      kind: 'ticket',
      label: 'General Admission - Annual Dipawali Fundraising Program',
      unitAmountCents: 10000,
      seatsPerUnit: 1,
      maxQuantity: 10
    }
  ]
};

const CHECKOUT = {
  orderRef: 'VH-0123456789ABCDEF',
  checkoutUrl: 'https://squareup.com/checkout/abc',
  subtotalAmountCents: 20000,
  discountCode: null,
  discountLabel: null,
  discountAmountCents: 0,
  totalAmountCents: 20000,
  currency: 'USD'
};

function stubApi() {
  const impl = vi.fn((url: string) => {
    const body = url.endsWith('/payments/products') ? CATALOGUE : CHECKOUT;
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(body))
    });
  });
  vi.stubGlobal('fetch', impl);
}

/**
 * Every event reported so far, as [name, params, options].
 *
 * Both `track` and `trackCustom`, because the call to action reports a custom
 * event and the checkout a standard one - a filter on `track` alone would
 * quietly report "no StartBooking" however well it was working.
 */
function trackedEvents(): [string, Record<string, unknown>, unknown][] {
  const fbq = window.fbq as unknown as ReturnType<typeof vi.fn>;
  return fbq.mock.calls
    .filter((call: unknown[]) => call[0] === 'track' || call[0] === 'trackCustom')
    .map((call: unknown[]) => call.slice(1) as [string, Record<string, unknown>, unknown]);
}

async function openTicketForm() {
  // Imported here, not at the top: the modules have to be loaded *after* the
  // pixel ID is stubbed in, or lib/pixel.ts captures an empty one and every
  // event below is a no-op.
  const { CheckoutProvider } = await import('./CheckoutProvider');
  const { SecureSeatSection } = await import('./SecureSeatSection');

  const user = userEvent.setup();
  render(
    <CheckoutProvider>
      <SecureSeatSection />
    </CheckoutProvider>
  );

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /purchase ticket/i })).toBeInTheDocument()
  );
  await user.click(screen.getByRole('button', { name: /purchase ticket/i }));
  return user;
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_META_PIXEL_ID', '123456789012345');
  // GA4 off, so the assertions below are only ever about Meta.
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
  // Stands in for the real fbq. lib/pixel.ts only ever calls through
  // `window.fbq`, so a spy here records exactly what Meta would receive.
  window.fbq = vi.fn() as unknown as typeof window.fbq;
  stubApi();
});

afterEach(() => {
  cleanup();
  delete window.fbq;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Meta pixel: the call-to-action click', () => {
  it('reports StartBooking when the form opens', async () => {
    await openTicketForm();
    await screen.findByRole('dialog');

    const [, params] = trackedEvents().find(([name]) => name === 'StartBooking')!;
    expect(params).toMatchObject({
      content_ids: ['ticket-general'],
      content_category: 'Event Ticket',
      value: 100,
      currency: 'USD'
    });
  });
});

describe('Meta pixel: InitiateCheckout', () => {
  it('is not sent when the form merely opens', async () => {
    await openTicketForm();
    await screen.findByRole('dialog');

    expect(trackedEvents().map(([name]) => name)).not.toContain('InitiateCheckout');
  });

  it('is sent on the handoff to Square, with the server total', async () => {
    const user = await openTicketForm();
    const dialog = await screen.findByRole('dialog');

    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '2');
    await user.type(within(dialog).getByLabelText(/full name/i), 'Deepa Rao');
    await user.type(within(dialog).getByLabelText(/^email$/i), 'deepa@example.com');
    await user.type(within(dialog).getByLabelText(/phone/i), '6313982890');
    await user.click(
      within(dialog).getByRole('button', { name: /continue to secure payment/i })
    );

    await waitFor(() =>
      expect(trackedEvents().map(([name]) => name)).toContain('InitiateCheckout')
    );

    const [, params, options] = trackedEvents().find(
      ([name]) => name === 'InitiateCheckout'
    )!;

    expect(params).toMatchObject({
      content_name: 'General Admission - Annual Dipawali Fundraising Program',
      content_category: 'Event Ticket',
      content_type: 'ticket',
      content_ids: ['ticket-general'],
      num_items: 2,
      // The server's figure, not two times the catalogue price worked out here.
      value: 200,
      currency: 'USD'
    });
    // Carries the order reference, so the Purchase for the same order can be
    // matched to it and a server-side report cannot count it twice.
    expect(options).toEqual({ eventID: CHECKOUT.orderRef });
  });

  it('is not sent when the form is rejected before anything is ordered', async () => {
    const user = await openTicketForm();
    const dialog = await screen.findByRole('dialog');

    // No name, no email, no phone: the click never reaches the API.
    await user.click(
      within(dialog).getByRole('button', { name: /continue to secure payment/i })
    );

    expect(trackedEvents().map(([name]) => name)).not.toContain('InitiateCheckout');
  });
});

describe('Meta pixel: Purchase', () => {
  it('is sent once a payment settles, and only once', async () => {
    const track = await import('../lib/track');

    const details = {
      orderRef: CHECKOUT.orderRef,
      value: 200,
      currency: 'USD',
      contentName: CATALOGUE.products[0].label,
      contentType: 'ticket',
      quantity: 2
    };

    expect(track.trackPurchase(details)).toBe(true);
    // The payment return dialog polls every two seconds and survives a reload.
    expect(track.trackPurchase(details)).toBe(false);

    const purchases = trackedEvents().filter(([name]) => name === 'Purchase');
    expect(purchases).toHaveLength(1);

    const [, params, options] = purchases[0];
    expect(params).toMatchObject({
      value: 200,
      currency: 'USD',
      content_name: CATALOGUE.products[0].label,
      content_type: 'ticket',
      content_category: 'Event Ticket'
    });
    expect(options).toEqual({ eventID: CHECKOUT.orderRef });
  });
});
