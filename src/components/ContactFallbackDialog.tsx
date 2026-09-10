import { useEffect, useId, useRef } from 'react';
import { CONTACT, SPONSORSHIP_MAILTO } from '../config/site';

const MAROON = '#4A0D12';
const GOLD = '#e98314';

export interface ContactFallbackDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Shown when a call to action cannot open the checkout form.
 *
 * That happens whenever the price list has not loaded - the API is down, the
 * browser is offline, or the request was blocked (a dev origin that CORS does
 * not allow will do it). The old fallback set `window.location.href` to a
 * `mailto:` link, which on a machine with no mail client configured does
 * nothing at all: the button looked broken. A visible dialog with the phone
 * number and the email address cannot fail that way.
 */
export function ContactFallbackDialog({ open, onClose }: ContactFallbackDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 10);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="my-auto w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <div
          className="rounded-t-2xl px-6 py-5"
          style={{ backgroundColor: MAROON }}
        >
          <h2
            id={titleId}
            className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-lg font-normal text-[#FFD238]"
          >
            Let us take this by phone or email
          </h2>
        </div>

        <div className="px-6 py-6">
          <p className="font-['Outfit',sans-serif] text-[12px] leading-relaxed text-gray-600">
            Online payment is unavailable at the moment. Please call or email us
            and we will book your tickets or arrange your sponsorship directly -
            your seats are not lost.
          </p>

          <div className="mt-4 space-y-2 rounded-lg bg-[#fff8f0] p-4">
            <a
              href={`tel:${CONTACT.phone}`}
              className="block font-['Outfit',sans-serif] text-[13px] font-bold text-[#4A0D12] hover:underline"
            >
              {CONTACT.phone}
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="block font-['Outfit',sans-serif] text-[13px] font-bold text-[#4A0D12] hover:underline"
            >
              {CONTACT.email}
            </a>
          </div>

          <a
            href={SPONSORSHIP_MAILTO}
            className="mt-4 block text-center font-['Outfit',sans-serif] text-[11px] font-semibold text-[#e98314] hover:underline"
          >
            Or send us a pre-filled enquiry
          </a>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-md py-2.5 font-['Outfit',sans-serif] text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: GOLD }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContactFallbackDialog;
