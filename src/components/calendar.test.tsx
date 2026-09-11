import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddToCalendar } from './AddToCalendar';
import { googleCalendarUrl } from '../lib/calendar';
import { EVENT } from '../config/site';
import type { OrderView } from '../lib/payments';

/**
 * The calendar hand-off offered after a payment settles.
 *
 * The link is the part worth testing hardest: it leaves our site and lands in
 * somebody's calendar, where a wrong date is not something we can correct
 * later. The component tests cover the promise made around it - that nothing
 * is claimed to have happened that has not actually happened yet.
 */

const ORDER: OrderView = {
  orderRef: 'VH-9F3C1A7E5B2D4086',
  status: 'paid',
  productLabel: 'General Admission - Annual Dipawali Fundraising Program',
  productKind: 'ticket',
  quantity: 2,
  seats: 2,
  subtotalAmountCents: 20000,
  discountCode: null,
  discountLabel: null,
  discountAmountCents: 0,
  totalAmountCents: 20000,
  deductibleAmountCents: 0,
  currency: 'USD',
  cardBrand: 'Visa',
  cardLast4: '4242',
  paidAt: '2026-09-10T12:00:00.000Z',
  createdAt: '2026-09-10T11:59:00.000Z'
};

/** Read one query parameter back out of the built link. */
function param(url: string, key: string): string {
  return new URL(url).searchParams.get(key) ?? '';
}

describe('The Google Calendar link', () => {
  it('points at Google’s event composer', () => {
    const url = new URL(googleCalendarUrl(ORDER));

    expect(url.origin + url.pathname).toBe(
      'https://calendar.google.com/calendar/render'
    );
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
  });

  it('sends the event date as venue wall-clock with its timezone, never as UTC', () => {
    const url = googleCalendarUrl(ORDER);

    // 5pm to 9pm on the day itself. Written as local time and tagged with the
    // zone, so Google applies the daylight-saving rules rather than us baking
    // in an offset that would be an hour wrong if the date ever moved.
    expect(param(url, 'dates')).toBe('20261024T170000/20261024T210000');
    expect(param(url, 'ctz')).toBe('America/New_York');
  });

  it('agrees with the date shown on the page', () => {
    // Both come from EVENT. This fails the moment someone edits one and not
    // the other, which is the mistake worth catching.
    expect(EVENT.dateLabel).toBe('Saturday, Oct 24, 2026');
    expect(param(googleCalendarUrl(ORDER), 'dates')).toContain('20261024');
  });

  it('carries a findable location', () => {
    const location = param(googleCalendarUrl(ORDER), 'location');

    expect(location).toContain('Pandit Jasraj Auditorium');
    expect(location).toContain('111 Jerusalem Ave');
    expect(location).toContain('Hempstead, NY 11550');
  });

  it('puts the booking reference in the entry, where the guest will have it', () => {
    const details = param(googleCalendarUrl(ORDER), 'details');

    expect(details).toContain('VH-9F3C1A7E5B2D4086');
    expect(details).toContain('General Admission');
    expect(details).toContain('Seats: 2');
  });

  it('does not double the full stop after a name that ends in one', () => {
    // "hosted by Vedic Heritage Inc.." - it reached the rendered page once.
    expect(param(googleCalendarUrl(ORDER), 'details')).not.toContain('..');
  });

  it('omits the seat line for a gift that bought no seats', () => {
    const details = param(
      googleCalendarUrl({ ...ORDER, seats: 0, productLabel: 'Bronze Sponsor' }),
      'details'
    );

    expect(details).not.toContain('Seats:');
    expect(details).toContain('Bronze Sponsor');
  });

  it('still builds a usable event with no order attached', () => {
    const url = googleCalendarUrl(null);

    expect(param(url, 'dates')).toBe('20261024T170000/20261024T210000');
    expect(param(url, 'details')).not.toContain('Reference:');
  });
});

describe('Being asked about the calendar', () => {
  it('offers rather than assumes, and shows the date being agreed to', () => {
    render(<AddToCalendar order={ORDER} />);

    expect(
      screen.getByText(/add this to your google calendar\?/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Saturday, Oct 24, 2026/)).toBeInTheDocument();
  });

  it('opens the pre-filled link in a new tab, safely', () => {
    render(<AddToCalendar order={ORDER} />);

    const link = screen.getByRole('link', { name: /yes, add it/i });
    expect(link).toHaveAttribute('target', '_blank');
    // The new tab must not get a handle back to this one.
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('calendar.google.com')
    );
  });

  it('does not claim the event was added, because Google has not saved it yet', async () => {
    const user = userEvent.setup();
    render(<AddToCalendar order={ORDER} />);

    await user.click(screen.getByRole('link', { name: /yes, add it/i }));

    // The honest message: it is open, not done. Telling someone it is in their
    // calendar when they have not pressed Save is how people miss the event.
    expect(screen.getByText(/open in a new tab/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing is added/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open it again/i })).toBeVisible();
  });

  it('collapses to one quiet line when declined, and can still be reopened', async () => {
    const user = userEvent.setup();
    render(<AddToCalendar order={ORDER} />);

    await user.click(screen.getByRole('button', { name: /no thanks/i }));

    expect(
      screen.queryByText(/add this to your google calendar\?/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /add the event to google calendar/i })
    ).toBeInTheDocument();
  });
});
