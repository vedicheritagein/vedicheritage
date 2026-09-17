import { useState } from 'react';
import { EVENT } from '../config/site';
import { googleCalendarUrl } from '../lib/calendar';
import type { OrderView } from '../lib/payments';
import { trackCustom } from '../lib/track';

const MAROON = '#4A0D12';
const GOLD = '#e98314';

export interface AddToCalendarProps {
  order: OrderView;
}

/**
 * "Shall we put this in your calendar?", asked once the payment has settled.
 *
 * Offered rather than done. The guest is told what will happen and taps yes,
 * which is both the courteous order of events and the only one available to
 * us - see `lib/calendar.ts` for why this is a pre-filled link and not an API
 * write. Declining collapses the whole thing to one quiet line, because the
 * confirmation is the important part of this dialog and a refused offer should
 * stop competing with it.
 *
 * The date is spelled out next to the button. Someone about to hand a booking
 * to their calendar should be able to see what date they are agreeing to
 * without opening another tab to find out.
 */
export function AddToCalendar({ order }: AddToCalendarProps) {
  const [state, setState] = useState<'asking' | 'opened' | 'declined'>('asking');
  const href = googleCalendarUrl(order);

  /**
   * Taking the calendar link is the strongest signal of intent to actually
   * turn up that this page can observe - a good deal stronger than the purchase
   * itself - which makes it a useful seed for a lookalike audience. Custom
   * rather than standard because Meta has no event that means this.
   */
  const handleOpened = () => {
    trackCustom('AddToCalendar', {
      order_ref: order.orderRef,
      content_type: order.productKind
    });
    setState('opened');
  };

  if (state === 'declined') {
    return (
      <p className="mt-4 font-['Outfit',sans-serif] text-[11px] text-gray-500">
        Changed your mind?{' '}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpened}
          className="font-semibold text-[#4A0D12] underline"
        >
          Add the event to Google Calendar
        </a>
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-[#f0dcc4] bg-[#fff8f0] p-4">
      {state === 'asking' ? (
        <>
          <p className="m-0 font-['Outfit',sans-serif] text-[12.5px] font-semibold text-gray-900">
            Add this to your Google Calendar?
          </p>
          <p className="m-0 mt-1 font-['Outfit',sans-serif] text-[11px] leading-relaxed text-gray-600">
            {EVENT.dateLabel} &middot; {EVENT.timeLabel} &middot; {EVENT.venue}.
            We will fill in the details and your reference &mdash; you just press
            save.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/*
              A real link, not a scripted window.open: a pop-up blocker will
              swallow the second one on some phones, and this way the guest can
              also long-press or middle-click it. `noopener` because the new tab
              must not get a handle back to this one.
            */}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpened}
              className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-['Outfit',sans-serif] text-[11px] font-bold uppercase tracking-wider text-white no-underline"
              style={{ backgroundColor: GOLD }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm8 3h-2v3H8v2h3v3h2v-3h3v-2h-3v-3z" />
              </svg>
              Yes, add it
            </a>

            <button
              type="button"
              onClick={() => setState('declined')}
              className="rounded-md px-3 py-2 font-['Outfit',sans-serif] text-[11px] font-semibold text-gray-500 hover:text-gray-700"
            >
              No thanks
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="m-0 font-['Outfit',sans-serif] text-[12.5px] font-semibold text-[#4A0D12]">
            Google Calendar is open in a new tab
          </p>
          {/*
            Said plainly, because this is the one thing that can still go wrong:
            we hand Google a filled-in event, and a guest who closes that tab
            without pressing Save will believe it is in their calendar when it
            is not.
          */}
          <p className="m-0 mt-1 font-['Outfit',sans-serif] text-[11px] leading-relaxed text-gray-600">
            Press <strong>Save</strong> there to finish adding it. Nothing is
            added to your calendar until you do.
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-['Outfit',sans-serif] text-[11px] font-semibold underline"
            style={{ color: MAROON }}
          >
            Open it again
          </a>
        </>
      )}
    </div>
  );
}

export default AddToCalendar;
