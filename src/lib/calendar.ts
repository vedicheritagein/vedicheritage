import { CONTACT, EVENT } from '../config/site';
import type { OrderView } from './payments';

/**
 * The "add this to my calendar" link offered once a payment has settled.
 *
 * This builds a link to Google's own event-composer, pre-filled. It does NOT
 * use the Calendar API, and that is a deliberate choice rather than a shortcut:
 * writing directly into somebody's calendar means an OAuth consent screen
 * asking a donor to grant a fundraiser site standing read/write access to every
 * calendar they own, a verified Cloud project, and tokens for us to hold. For
 * one event, on a site that stores nothing about the guest afterwards, that is
 * a large amount of access to ask for and a large amount of liability to keep.
 *
 * The pre-filled link needs no account, no permission and no key, works the
 * same on a phone as on a laptop, and lands the guest on Google's page with
 * every field already filled - they press Save. The one step we cannot remove
 * is that Save, and it is the step that means we never touched their calendar
 * without them seeing exactly what was going in.
 */

/** Google wants `YYYYMMDDTHHMMSS`, with no punctuation. */
function compact(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
}

/**
 * What the guest will read in the calendar entry.
 *
 * The order reference is the point of putting it here: on the night it is the
 * thing the door needs, and by then the confirmation email is buried. A guest
 * who has the event in their calendar has their reference with it.
 */
/** "Vedic Heritage Inc." already ends in a full stop; do not give it a second. */
const sentence = (text: string) => (text.endsWith('.') ? text : `${text}.`);

function describe(order?: OrderView | null): string {
  const lines = [
    sentence(
      `You are booked for the ${EVENT.title}, hosted by ${EVENT.organisation}`
    ),
  ];

  if (order) {
    lines.push('', `Reference: ${order.orderRef}`, `Booking: ${order.productLabel}`);
    // Sponsorships and tickets both carry seats; a gift with none should not
    // announce "Seats: 0" to someone who did not buy a seat.
    if (order.seats > 0) {
      lines.push(`Seats: ${order.seats}`);
    }
    lines.push('', 'Please bring your reference with you.');
  }

  lines.push(
    '',
    `Venue: ${EVENT.venue}, ${EVENT.address}`,
    `Doors: ${EVENT.timeLabel}`,
    '',
    `Questions: ${CONTACT.email} or ${CONTACT.phone}`
  );

  return lines.join('\n');
}

/**
 * A Google Calendar "create event" link with the event and booking filled in.
 *
 * Times go across as venue wall-clock plus `ctz`, never as UTC. Google then
 * resolves the offset itself, so this stays correct through a daylight-saving
 * change and lands at 5pm local for a guest whose own calendar is set to
 * another timezone - which is the case for anyone travelling in.
 */
export function googleCalendarUrl(order?: OrderView | null): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${EVENT.title} - ${EVENT.organisation}`,
    dates: `${compact(EVENT.date, EVENT.startTime)}/${compact(EVENT.date, EVENT.endTime)}`,
    ctz: EVENT.timeZone,
    location: `${EVENT.venue}, ${EVENT.address}`,
    details: describe(order),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
