import { useCallback } from 'react';
import { BOOKING, SPONSORSHIP_SKUS, TICKET_SKU } from '../config/site';
import { useCheckout } from './checkoutContext';

/**
 * Start ticket booking.
 *
 * Every "Book now" on the page routes through here, so all of them behave
 * identically and there is one place to change if booking ever moves to an
 * external ticketing page. That matters more than it sounds: the buttons used
 * to scroll to the tickets section instead, which meant a visitor who clicked
 * one still had to find and press a second button to actually buy anything.
 *
 * `BOOKING.ticketUrl` keeps its override - if the event is ever sold through a
 * third party, setting it there redirects every booking button at once.
 *
 * Always safe to call: `openCheckout` shows the phone/email dialog when the
 * price list is unavailable, so no route out of a call to action is a dead end.
 */
export function useBookTickets(): () => void {
  const { openCheckout } = useCheckout();

  return useCallback(() => {
    if (BOOKING.ticketUrl) {
      window.location.href = BOOKING.ticketUrl;
      return;
    }
    openCheckout(TICKET_SKU);
  }, [openCheckout]);
}

/**
 * Tier the sponsorship form opens on.
 *
 * The entry tier, deliberately: a "Sponsor now" button has to start somewhere
 * and presuming a $20,000 gift would be presumptuous. Which tier is actually
 * bought is chosen in the form's own selector, so this is only where the form
 * lands - and both "Sponsor now" buttons land in the same place because they
 * read it from here rather than each deriving their own.
 */
export const ENTRY_SPONSORSHIP_SKU = SPONSORSHIP_SKUS.bronze;

/**
 * Open the sponsorship form.
 *
 * Same contract as `useBookTickets`: always safe to call, and it falls back to
 * the phone/email dialog when the price list is unavailable, so the button is
 * never a dead end.
 */
export function useSponsorNow(): () => void {
  const { openCheckout } = useCheckout();

  return useCallback(() => {
    openCheckout(ENTRY_SPONSORSHIP_SKU);
  }, [openCheckout]);
}
