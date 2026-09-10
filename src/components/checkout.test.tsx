import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutProvider } from './CheckoutProvider';
import { SponsorshipSection } from './SponsorshipSection';
import { SecureSeatSection } from './SecureSeatSection';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { CelebrateSection } from './CelebrateSection';
import type { Catalogue } from '../lib/payments';

/**
 * Tests for the part of the site that takes money.
 *
 * They drive the real components through a real DOM, with only `fetch`
 * replaced - so the price list, the tier selector, the validation rules and the
 * fallback path are all exercised as a buyer would meet them.
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
    },
    {
      sku: 'sponsor-palladium',
      kind: 'sponsorship',
      label: 'Palladium Sponsor',
      unitAmountCents: 2000000,
      seatsPerUnit: 10,
      maxQuantity: 1
    },
    {
      sku: 'sponsor-gold',
      kind: 'sponsorship',
      label: 'Gold Sponsor',
      unitAmountCents: 500000,
      seatsPerUnit: 4,
      maxQuantity: 1
    },
    {
      sku: 'sponsor-bronze',
      kind: 'sponsorship',
      label: 'Bronze Sponsor',
      unitAmountCents: 100000,
      seatsPerUnit: 2,
      maxQuantity: 1
    }
  ]
};

interface FetchCall {
  url: string;
  init?: RequestInit;
}

/**
 * Stub fetch for both endpoints the page uses.
 *
 * `catalogue: false` simulates the API being unreachable, which is the case
 * that used to leave every button doing nothing at all.
 */
function stubApi(options: { catalogue?: Catalogue | false; checkoutStatus?: number; checkoutBody?: object } = {}) {
  const calls: FetchCall[] = [];
  const catalogue = options.catalogue === undefined ? CATALOGUE : options.catalogue;

  const json = (status: number, body: object) =>
    Promise.resolve({
      ok: status < 400,
      status,
      text: () => Promise.resolve(JSON.stringify(body))
    });

  const impl = vi.fn((url: string, init?: RequestInit) => {
    calls.push({ url, init });

    // Stands in for the server's discount catalogue, and mirrors DIPAWALI10:
    // 10% off admission, capped at $50, on orders of $200 or more. The stub -
    // never the form - decides the saving, so a test can only pass if the form
    // asked and rendered the answer.
    if (url.endsWith('/payments/discounts/preview')) {
      const sent = JSON.parse(String(init?.body ?? '{}')) as {
        code?: string;
        sku?: string;
        quantity?: number;
      };
      const product = CATALOGUE.products.find((item) => item.sku === sent.sku);
      const subtotal = (product?.unitAmountCents ?? 0) * (sent.quantity ?? 0);

      if (sent.code !== 'DIPAWALI10' || product?.kind !== 'ticket') {
        return json(404, {
          error: 'invalid_discount_code',
          message: `"${sent.code}" is not a valid discount code.`
        });
      }
      if (subtotal < 20000) {
        return json(400, {
          error: 'discount_below_minimum',
          message: 'DIPAWALI10 applies to orders of $200 or more.'
        });
      }

      const discountAmountCents = Math.min(Math.round(subtotal * 0.1), 5000);
      return json(200, {
        code: 'DIPAWALI10',
        label: '10% off admission',
        subtotalAmountCents: subtotal,
        discountAmountCents,
        totalAmountCents: subtotal - discountAmountCents,
        currency: 'USD'
      });
    }

    if (url.endsWith('/payments/products')) {
      if (catalogue === false) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(catalogue))
      });
    }

    if (url.endsWith('/payments/checkout')) {
      const status = options.checkoutStatus ?? 201;
      const body =
        options.checkoutBody ??
        {
          orderRef: 'VH-0123456789ABCDEF',
          checkoutUrl: 'https://squareup.com/checkout/abc',
          totalAmountCents: 100000,
          currency: 'USD'
        };
      return Promise.resolve({
        ok: status < 400,
        status,
        text: () => Promise.resolve(JSON.stringify(body))
      });
    }

    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('{}') });
  });

  vi.stubGlobal('fetch', impl);
  return calls;
}

/** Click the section-level sponsorship CTA and wait for the form. */
async function openSponsorshipForm() {
  const user = userEvent.setup();
  render(
    <CheckoutProvider>
      <SponsorshipSection />
    </CheckoutProvider>
  );
  // The price list has to arrive before the CTA can open the form.
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /sponsor now/i })).toBeInTheDocument()
  );
  await user.click(screen.getByRole('button', { name: /sponsor now/i }));
  return user;
}

describe('Sponsorship section', () => {
  beforeEach(() => stubApi());

  it('shows all six tiers as a price list with one call to action', async () => {
    render(
      <CheckoutProvider>
        <SponsorshipSection />
      </CheckoutProvider>
    );

    expect(screen.getByText(/palladium sponsor/i)).toBeInTheDocument();
    expect(screen.getByText(/bronze sponsor/i)).toBeInTheDocument();

    // One button for the whole section: the cards describe, they do not act.
    const buttons = screen.getAllByRole('button', { name: /sponsor now/i });
    expect(buttons).toHaveLength(1);
    expect(screen.queryByText(/contact us to sponsor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/enquire about sponsorship/i)).not.toBeInTheDocument();
  });

  it('renders server prices rather than hardcoded copy', async () => {
    render(
      <CheckoutProvider>
        <SponsorshipSection />
      </CheckoutProvider>
    );
    await waitFor(() => expect(screen.getByText('$20,000')).toBeInTheDocument());
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });
});

describe('Checkout form: sponsorship', () => {
  beforeEach(() => stubApi());

  it('opens with a tier selector listing every tier and its price', async () => {
    await openSponsorshipForm();

    const dialog = await screen.findByRole('dialog');
    const select = within(dialog).getByLabelText(/choose your sponsorship tier/i);
    const options = within(select as HTMLElement).getAllByRole('option');

    expect(options.map((o) => o.textContent)).toEqual([
      'Palladium Sponsor - $20,000',
      'Gold Sponsor - $5,000',
      'Bronze Sponsor - $1,000'
    ]);
  });

  it('re-prices the total when a different tier is chosen', async () => {
    const user = await openSponsorshipForm();
    const dialog = await screen.findByRole('dialog');

    // Opens on the entry tier.
    expect(within(dialog).getByText('$1,000')).toBeInTheDocument();

    await user.selectOptions(
      within(dialog).getByLabelText(/choose your sponsorship tier/i),
      'sponsor-palladium'
    );

    expect(within(dialog).getByText('$20,000')).toBeInTheDocument();
    expect(within(dialog).queryByText('$1,000')).not.toBeInTheDocument();
    expect(within(dialog).getByText(/10 complimentary seats included/i)).toBeInTheDocument();
  });

  it('offers no discount code, since none applies to a gift', async () => {
    // Every code in the server catalogue is ticket-only, so a field here could
    // only ever be refused - and would send sponsors hunting for a code that
    // does not exist.
    await openSponsorshipForm();
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).queryByLabelText(/discount code/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /^apply$/i })).not.toBeInTheDocument();
  });

  it('keeps what the buyer typed when the tier changes', async () => {
    const user = await openSponsorshipForm();
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText(/full name/i), 'Deepa Rao');
    await user.selectOptions(
      within(dialog).getByLabelText(/choose your sponsorship tier/i),
      'sponsor-gold'
    );

    expect(within(dialog).getByLabelText(/full name/i)).toHaveValue('Deepa Rao');
  });

  it('requires a location, and says why', async () => {
    const user = await openSponsorshipForm();
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText(/full name/i), 'Deepa Rao');
    await user.type(within(dialog).getByLabelText(/^email$/i), 'deepa@example.com');
    await user.type(within(dialog).getByLabelText(/phone/i), '(631) 398-2890');
    await user.click(within(dialog).getByRole('button', { name: /continue to secure payment/i }));

    expect(
      within(dialog).getByText(/please enter your city and state/i)
    ).toBeInTheDocument();
  });

  it('sends the tier, the location and no amount at all', async () => {
    const calls = stubApi();
    const user = await openSponsorshipForm();
    const dialog = await screen.findByRole('dialog');

    await user.selectOptions(
      within(dialog).getByLabelText(/choose your sponsorship tier/i),
      'sponsor-gold'
    );
    await user.type(within(dialog).getByLabelText(/full name/i), 'Deepa Rao');
    await user.type(within(dialog).getByLabelText(/^email$/i), 'Deepa@Example.COM');
    await user.type(within(dialog).getByLabelText(/phone/i), '(631) 398-2890');
    await user.type(within(dialog).getByLabelText(/location/i), '  Hicksville, NY  ');
    await user.click(within(dialog).getByRole('button', { name: /continue to secure payment/i }));

    await waitFor(() =>
      expect(calls.some((c) => c.url.endsWith('/payments/checkout'))).toBe(true)
    );

    const checkout = calls.find((c) => c.url.endsWith('/payments/checkout'))!;
    const sent = JSON.parse(String(checkout.init?.body));
    expect(sent.sku).toBe('sponsor-gold');
    expect(sent.location).toBe('Hicksville, NY');
    expect(sent.discountCode).toBeUndefined();
    expect(sent.email).toBe('deepa@example.com');
    expect(sent).not.toHaveProperty('totalAmountCents');
    expect(sent).not.toHaveProperty('unitAmountCents');
    expect(String(sent.idempotencyKey).length).toBeGreaterThanOrEqual(16);
  });

  it('shows the server message when the server refuses the order', async () => {
    stubApi({
      checkoutStatus: 400,
      checkoutBody: { error: 'location_required', message: 'Please tell us your city and state.' }
    });
    const user = await openSponsorshipForm();
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText(/full name/i), 'Deepa Rao');
    await user.type(within(dialog).getByLabelText(/^email$/i), 'deepa@example.com');
    await user.type(within(dialog).getByLabelText(/phone/i), '6313982890');
    await user.type(within(dialog).getByLabelText(/location/i), 'Hicksville, NY');
    await user.click(within(dialog).getByRole('button', { name: /continue to secure payment/i }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      /city and state/i
    );
  });

  it('rejects a name containing markup before anything is sent', async () => {
    const calls = stubApi();
    const user = await openSponsorshipForm();
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText(/full name/i), '<script>x</script>');
    await user.type(within(dialog).getByLabelText(/^email$/i), 'a@b.co');
    await user.type(within(dialog).getByLabelText(/phone/i), '6313982890');
    await user.type(within(dialog).getByLabelText(/location/i), 'Hicksville, NY');
    await user.click(within(dialog).getByRole('button', { name: /continue to secure payment/i }));

    expect(within(dialog).getByText(/remove any special characters/i)).toBeInTheDocument();
    expect(calls.some((c) => c.url.endsWith('/payments/checkout'))).toBe(false);
  });
});

describe('Checkout form: tickets', () => {
  beforeEach(() => stubApi());

  it('asks for a quantity and never for a location', async () => {
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

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/number of tickets/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/discount code/i)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/location/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/sponsorship tier/i)).not.toBeInTheDocument();
  });

  it('multiplies the total by the quantity', async () => {
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

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    expect(within(dialog).getByText('$300')).toBeInTheDocument();
  });
});

describe('When the payments API is unreachable', () => {
  it('opens a contact dialog instead of doing nothing', async () => {
    // The regression this guards: both calls to action used to navigate to a
    // mailto: link, which does nothing visible on a machine with no mail
    // client, so the buttons looked broken.
    stubApi({ catalogue: false });
    const user = userEvent.setup();

    render(
      <CheckoutProvider>
        <SponsorshipSection />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /sponsor now/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/phone or email/i);
    expect(within(dialog).getByText('+16318059105')).toBeInTheDocument();
    expect(within(dialog).getByText('vedic.heritageinc@gmail.com')).toBeInTheDocument();
  });

  it('does the same for the ticket button', async () => {
    stubApi({ catalogue: false });
    const user = userEvent.setup();

    render(
      <CheckoutProvider>
        <SecureSeatSection />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /purchase ticket/i }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      /online payment is unavailable/i
    );
  });

  it('closes the contact dialog on Escape', async () => {
    stubApi({ catalogue: false });
    const user = userEvent.setup();

    render(
      <CheckoutProvider>
        <SponsorshipSection />
      </CheckoutProvider>
    );
    await user.click(screen.getByRole('button', { name: /sponsor now/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

/**
 * Discount codes.
 *
 * The stub mirrors the server's contract rather than the form's wishes: the
 * request carries a code, a SKU and a quantity, and the *stub* decides the
 * saving. So a test can only pass if the form asked the server and rendered
 * the answer - which is the property that matters, since the browser is not
 * allowed to compute a discount.
 */
describe('Discount codes', () => {
  beforeEach(() => stubApi());

  /** Open the ticket form, which is where a code is entered. */
  async function openTicketForm() {
    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <SecureSeatSection />
      </CheckoutProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /purchase ticket/i })
      ).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /purchase ticket/i }));
    return { user, dialog: await screen.findByRole('dialog') };
  }

  async function fillBuyer(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
    await user.type(within(dialog).getByLabelText(/full name/i), 'Asha Iyer');
    await user.type(within(dialog).getByLabelText(/^email$/i), 'asha@example.com');
    await user.type(within(dialog).getByLabelText(/phone/i), '(631) 398-2890');
  }

  it('shows the saving and the discounted total once a code is applied', async () => {
    const { user, dialog } = await openTicketForm();

    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    expect(within(dialog).getByText('$300')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/discount code/i), 'dipawali10');
    await user.click(within(dialog).getByRole('button', { name: /^apply$/i }));

    // 10% of $300, as priced by the server.
    await waitFor(() =>
      expect(within(dialog).getByText(/you save \$30/i)).toBeInTheDocument()
    );
    expect(within(dialog).getByText('Subtotal')).toBeInTheDocument();
    expect(within(dialog).getByText('$270')).toBeInTheDocument();
  });

  it('sends the code and never an amount', async () => {
    const calls = stubApi();
    const { user, dialog } = await openTicketForm();

    await fillBuyer(user, dialog);
    // Three tickets: over the code's own minimum order value.
    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    await user.type(within(dialog).getByLabelText(/discount code/i), 'dipawali10');
    await user.click(within(dialog).getByRole('button', { name: /^apply$/i }));
    await waitFor(() =>
      expect(within(dialog).getByText(/you save/i)).toBeInTheDocument()
    );

    await user.click(
      within(dialog).getByRole('button', { name: /continue to secure payment/i })
    );

    await waitFor(() =>
      expect(calls.some((c) => c.url.endsWith('/payments/checkout'))).toBe(true)
    );
    const checkout = calls.find((c) => c.url.endsWith('/payments/checkout'))!;
    const sent = JSON.parse(String(checkout.init?.body));

    expect(sent.discountCode).toBe('DIPAWALI10');
    expect(sent).not.toHaveProperty('discountAmountCents');
    expect(sent).not.toHaveProperty('totalAmountCents');
  });

  it('re-prices the discount when the quantity changes', async () => {
    const { user, dialog } = await openTicketForm();

    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    await user.type(within(dialog).getByLabelText(/discount code/i), 'DIPAWALI10');
    await user.click(within(dialog).getByRole('button', { name: /^apply$/i }));
    await waitFor(() =>
      expect(within(dialog).getByText(/you save \$30/i)).toBeInTheDocument()
    );

    // A stale saving here would be the bug: 10% of five tickets is $50, and
    // the figure has to come back from the server, not from the browser.
    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '5');
    await waitFor(() =>
      expect(within(dialog).getByText(/you save \$50/i)).toBeInTheDocument()
    );
    expect(within(dialog).getByText('$450')).toBeInTheDocument();
  });

  it('drops the discount, with the reason, when the order stops qualifying', async () => {
    const { user, dialog } = await openTicketForm();

    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    await user.type(within(dialog).getByLabelText(/discount code/i), 'DIPAWALI10');
    await user.click(within(dialog).getByRole('button', { name: /^apply$/i }));
    await waitFor(() =>
      expect(within(dialog).getByText(/you save \$30/i)).toBeInTheDocument()
    );

    // One ticket is below the code's minimum, so the stub refuses it.
    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '1');

    await waitFor(() =>
      expect(within(dialog).getByText(/\$200 or more/i)).toBeInTheDocument()
    );
    expect(within(dialog).queryByText(/you save/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Subtotal')).not.toBeInTheDocument();
    // Charged the honest price, not a discount that was refused.
    expect(within(dialog).getByText('$100')).toBeInTheDocument();
  });

  it('shows the server reason for a code it will not accept', async () => {
    const { user, dialog } = await openTicketForm();

    await user.type(within(dialog).getByLabelText(/discount code/i), 'nosuchcode');
    await user.click(within(dialog).getByRole('button', { name: /^apply$/i }));

    await waitFor(() =>
      expect(
        within(dialog).getByText(/is not a valid discount code/i)
      ).toBeInTheDocument()
    );
    // Total untouched.
    expect(within(dialog).getByText('$100')).toBeInTheDocument();
  });

  it('applies on Enter instead of starting the payment', async () => {
    const calls = stubApi();
    const { user, dialog } = await openTicketForm();

    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    await user.type(
      within(dialog).getByLabelText(/discount code/i),
      'DIPAWALI10{Enter}'
    );

    await waitFor(() =>
      expect(within(dialog).getByText(/you save \$30/i)).toBeInTheDocument()
    );
    // Enter in a code field must never send the buyer to the payment page.
    expect(calls.some((c) => c.url.endsWith('/payments/checkout'))).toBe(false);
  });

  it('removes an applied code and restores the full price', async () => {
    const { user, dialog } = await openTicketForm();

    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    await user.type(within(dialog).getByLabelText(/discount code/i), 'DIPAWALI10');
    await user.click(within(dialog).getByRole('button', { name: /^apply$/i }));
    await waitFor(() =>
      expect(within(dialog).getByText(/you save \$30/i)).toBeInTheDocument()
    );

    await user.click(within(dialog).getByRole('button', { name: /remove/i }));

    expect(within(dialog).queryByText(/you save/i)).not.toBeInTheDocument();
    expect(within(dialog).getByText('$300')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/discount code/i)).toHaveValue('');
  });

  it('removes a code the checkout refuses, so the retry can go through', async () => {
    stubApi({
      checkoutStatus: 400,
      checkoutBody: {
        error: 'discount_expired',
        message: 'DIPAWALI10 has expired.'
      }
    });
    const { user, dialog } = await openTicketForm();

    await fillBuyer(user, dialog);
    await user.selectOptions(within(dialog).getByLabelText(/number of tickets/i), '3');
    await user.type(within(dialog).getByLabelText(/discount code/i), 'DIPAWALI10');
    await user.click(within(dialog).getByRole('button', { name: /^apply$/i }));
    await waitFor(() =>
      expect(within(dialog).getByText(/you save \$30/i)).toBeInTheDocument()
    );

    await user.click(
      within(dialog).getByRole('button', { name: /continue to secure payment/i })
    );

    // A code the server refused cannot stay on the form showing a total that
    // can never be charged.
    await waitFor(() =>
      expect(within(dialog).getByText(/has expired/i)).toBeInTheDocument()
    );
    expect(within(dialog).queryByText(/you save/i)).not.toBeInTheDocument();
    expect(within(dialog).getByText('$300')).toBeInTheDocument();
  });

});

/**
 * Booking buttons.
 *
 * Every "book" call to action has to open the ticket form. They used to scroll
 * to the tickets section instead, which meant the most prominent buttons on the
 * page - including the one in the navbar - did not actually start a booking:
 * the visitor had to arrive somewhere and press a second button. These tests
 * name each button by the text a visitor sees, so a relabelled button that
 * stops booking fails here.
 */
describe('Booking buttons', () => {
  beforeEach(() => stubApi());

  /** A promise whose settlement this test controls. */
  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  async function expectsTicketForm() {
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /book your tickets/i })
    ).toBeInTheDocument();
    // The ticket form specifically: a quantity, and no sponsorship fields.
    expect(within(dialog).getByLabelText(/number of tickets/i)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/sponsorship tier/i)).not.toBeInTheDocument();
    return dialog;
  }

  it('opens the ticket form from the navbar Book Now', async () => {
    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <Navbar />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /^book now$/i }));
    await expectsTicketForm();
  });

  it('opens the ticket form from the hero BOOK NOW', async () => {
    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <Hero />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /^book now$/i }));
    await expectsTicketForm();
  });

  it('opens the ticket form from BOOK YOUR TICKET NOW', async () => {
    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <CelebrateSection />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /book your ticket now/i }));
    await expectsTicketForm();
  });

  it('opens the ticket form from the navbar on mobile, closing the menu first', async () => {
    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <Navbar />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /toggle menu/i }));
    // Two now: the desktop button and the one in the open menu.
    const buttons = screen.getAllByRole('button', { name: /^book now$/i });
    expect(buttons).toHaveLength(2);

    await user.click(buttons[1]);
    await expectsTicketForm();
    // The form must not open behind an overlaying menu.
    expect(screen.getAllByRole('button', { name: /^book now$/i })).toHaveLength(1);
  });

  it('honours a click made before the price list has arrived', async () => {
    // The race the navbar button makes real: it is above the fold and clickable
    // immediately, so on a cold API a visitor can beat the price list. The
    // click has to be remembered, not answered with "phone us instead".
    const gate = deferred<void>();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/payments/products')) {
          await gate.promise;
          return {
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify(CATALOGUE))
          };
        }
        return { ok: false, status: 404, text: () => Promise.resolve('{}') };
      })
    );

    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <Navbar />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /^book now$/i }));

    // Something visible in the meantime, rather than a button that did nothing.
    expect(await screen.findByText(/loading ticket prices/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    gate.resolve();

    await expectsTicketForm();
    expect(screen.queryByText(/loading ticket prices/i)).not.toBeInTheDocument();
  });

  it('falls back to contact details if that price list never arrives', async () => {
    const gate = deferred<void>();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/payments/products')) {
          await gate.promise;
          throw new TypeError('Failed to fetch');
        }
        return { ok: false, status: 404, text: () => Promise.resolve('{}') };
      })
    );

    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <Navbar />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /^book now$/i }));
    expect(await screen.findByText(/loading ticket prices/i)).toBeInTheDocument();

    gate.reject();

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/phone or email/i);
    expect(screen.queryByText(/loading ticket prices/i)).not.toBeInTheDocument();
  });
});

/**
 * Sponsor Now in the closing section.
 *
 * The page's last call to action for sponsors. It used to navigate to a
 * `mailto:` link - which does nothing at all on a machine with no mail client -
 * so it looked broken to precisely the visitor worth the most to the
 * fundraiser. It now opens the sponsorship form, landing on the same tier as
 * the button in the sponsorship section.
 */
describe('Sponsor Now (closing section)', () => {
  beforeEach(() => stubApi());

  async function openFromClosingSection() {
    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <SecureSeatSection />
      </CheckoutProvider>
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sponsor now/i })).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /sponsor now/i }));
    return { user, dialog: await screen.findByRole('dialog') };
  }

  it('offers Sponsor Now rather than a contact enquiry', async () => {
    render(
      <CheckoutProvider>
        <SecureSeatSection />
      </CheckoutProvider>
    );

    expect(screen.getByRole('button', { name: /sponsor now/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /contact for sponsorship/i })
    ).not.toBeInTheDocument();
  });

  it('opens the sponsorship form, with the tier selector', async () => {
    const { dialog } = await openFromClosingSection();

    expect(
      within(dialog).getByRole('heading', { name: /confirm your sponsorship/i })
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/choose your sponsorship tier/i)).toBeInTheDocument();
    // A sponsorship, so recognition details are asked for and no ticket
    // quantity or discount code is offered.
    expect(within(dialog).getByLabelText(/location/i)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/number of tickets/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/discount code/i)).not.toBeInTheDocument();
  });

  it('lands on the same tier as the sponsorship section button', async () => {
    // Both read the entry tier from lib/booking, so they cannot drift apart.
    const { dialog } = await openFromClosingSection();
    expect(within(dialog).getByText('$1,000')).toBeInTheDocument();
  });

  it('still leads somewhere when the price list is unavailable', async () => {
    stubApi({ catalogue: false });
    const user = userEvent.setup();
    render(
      <CheckoutProvider>
        <SecureSeatSection />
      </CheckoutProvider>
    );

    await user.click(screen.getByRole('button', { name: /sponsor now/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/phone or email/i);
    expect(within(dialog).getByText('+16318059105')).toBeInTheDocument();
  });
});
