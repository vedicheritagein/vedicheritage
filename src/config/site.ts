/**
 * Navigation targets and outbound contact details.
 *
 * Every call to action on the page resolves through this file, so there is one
 * place to change when the booking flow gets a real payment provider.
 */

/**
 * Anchor ids. Each value is set as the `id` of the matching <section>, so these
 * are the single source of truth for both the navbar and the footer links -
 * a typo here fails loudly in `SECTION_LABELS` rather than silently producing a
 * dead link.
 */
export const SECTION = {
  home: 'home',
  aboutEvent: 'about-event',
  artists: 'artists',
  sponsorship: 'sponsorship',
  community: 'community',
  about: 'about',
  tickets: 'tickets',
  contact: 'contact',
} as const;

export type SectionId = (typeof SECTION)[keyof typeof SECTION];

/** Contact routes used by the call-to-action buttons. */
export const CONTACT = {
  email: 'vedic.heritageinc@gmail.com',
  /** Primary booking line (Manjula). `tel:` needs E.164, the label stays as designed. */
  phone: '+16318059105',
  /** Used by the footer "Map" link and the JSON-LD address. */
  address: '111 Jerusalem Ave, Hempstead, NY 11550, USA',
} as const;

/**
 * Product identifiers understood by the payments API.
 *
 * These are keys, NOT prices. The server holds the only authoritative price
 * list (see `src/config/payments.ts` in the backend) and the browser never
 * sends an amount, so a tampered client cannot change what is charged. The
 * amounts shown on the page are fetched from the API at runtime.
 */
export const TICKET_SKU = 'ticket-general';

/** Sponsorship tier SKUs, highest first, matching the backend catalogue. */
export const SPONSORSHIP_SKUS = {
  palladium: 'sponsor-palladium',
  platinum: 'sponsor-platinum',
  diamond: 'sponsor-diamond',
  gold: 'sponsor-gold',
  silver: 'sponsor-silver',
  bronze: 'sponsor-bronze',
} as const;

/**
 * The organisation's main website.
 *
 * This event site is a standalone single page; "Explore Vedic Heritage" sends
 * visitors to the main site for everything outside the fundraiser - temple
 * timings, daily worship, other programmes.
 */
export const ORG_WEBSITE_URL = 'https://vedicheritage-inc.org/';

/**
 * Build a link into the main site.
 *
 * Every one of these was verified to return 200 at the time of writing. They
 * are the main site's own footer destinations, which is why the labels here
 * match it so closely - this page's footer was copied from it, but had been
 * left pointing at in-page anchors that did not exist.
 */
export const orgUrl = (path: string) =>
  `${ORG_WEBSITE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

/**
 * Fallback destination for when the payments API cannot be reached.
 *
 * Online checkout is handled by the payments API, not by a link here. This
 * remains as the graceful-degradation path: if the API is unreachable, booking
 * buttons fall back to the pre-filled email below rather than becoming dead
 * ends. Setting `ticketUrl` still overrides the final purchase button if the
 * event ever needs to point at an external ticketing page instead.
 */
export const BOOKING: { ticketUrl: string | null } = {
  ticketUrl: null,
};

const mailto = (subject: string, body?: string) =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}` +
  (body ? `&body=${encodeURIComponent(body)}` : '');

/** Pre-filled ticket enquiry, used when no `ticketUrl` is configured. */
export const TICKET_ENQUIRY_MAILTO = mailto(
  'Ticket booking - Annual Dipawali Fundraising Program',
  'Namaste,\n\nI would like to book tickets for the Annual Dipawali Fundraising ' +
    'Program on Saturday, October 24, 2026.\n\nNumber of tickets:\nName:\nPhone:\n\nThank you.'
);

/** Pre-filled sponsorship enquiry. */
export const SPONSORSHIP_MAILTO = mailto(
  'Sponsorship enquiry - Annual Dipawali Fundraising Program',
  'Namaste,\n\nI am interested in sponsoring the Annual Dipawali Fundraising ' +
    'Program on Saturday, October 24, 2026.\n\nSponsorship tier:\nName:\nPhone:\n\nThank you.'
);

export const VOLUNTEER_MAILTO = mailto('Volunteering enquiry - Vedic Heritage');

export const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  CONTACT.address
)}`;

/** Resolved destination for the final "Purchase ticket" button. */
export const ticketDestination = () => BOOKING.ticketUrl ?? TICKET_ENQUIRY_MAILTO;
