import { useEffect, useState } from 'react';
import { CONTACT } from '../config/site';
import { fetchOrder, formatMoney, type OrderView } from '../lib/payments';

export interface PaymentReturnProps {
  orderRef: string;
  onDismiss: () => void;
}

const MAROON = '#4A0D12';
const GOLD = '#e98314';

/**
 * How long to keep asking before giving up.
 *
 * A payment normally settles before the buyer even lands here. Polling covers
 * the case where the provider's webhook is delayed - the status endpoint asks
 * the provider directly on each call, so this resolves without a webhook ever
 * arriving. After the cutoff the buyer gets a "we are checking" message with
 * their reference rather than an indefinite spinner.
 */
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;

type ViewState = 'loading' | 'settled' | 'still-pending' | 'error';

export function PaymentReturn({ orderRef, onDismiss }: PaymentReturnProps) {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [state, setState] = useState<ViewState>('loading');

  useEffect(() => {
    // Both flags are effect-local rather than refs, so a re-run cannot inherit
    // stale state from a previous poll, and cleanup reliably stops this one.
    let cancelled = false;
    let timer: number | undefined;
    const startedAt = Date.now();

    // A function declaration, so referring to `tick` inside its own body to
    // schedule the next poll is unambiguous.
    async function tick(): Promise<void> {
      try {
        const { order: fetched } = await fetchOrder(orderRef);
        if (cancelled) return;

        setOrder(fetched);

        if (fetched.status !== 'pending') {
          setState('settled');
          return;
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setState('still-pending');
          return;
        }

        timer = window.setTimeout(() => void tick(), POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setState('error');
      }
    }

    void tick();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [orderRef]);

  const isPaid = order?.status === 'paid';
  const isRefunded = order?.status === 'refunded';
  const failed = order?.status === 'failed' || order?.status === 'canceled';

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        className="my-auto w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <div
          className="rounded-t-2xl px-6 py-5 text-center"
          style={{ backgroundColor: MAROON }}
        >
          <h2 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-xl font-normal text-[#FFD238]">
            {state === 'loading' && 'Confirming your payment'}
            {state === 'settled' && isPaid && 'Thank You'}
            {state === 'settled' && isRefunded && 'Payment Refunded'}
            {state === 'settled' && failed && 'Payment Not Completed'}
            {state === 'still-pending' && 'Still Confirming'}
            {state === 'error' && 'Could Not Check Status'}
          </h2>
        </div>

        <div className="px-6 py-6">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200"
                style={{ borderTopColor: GOLD }}
                aria-hidden="true"
              />
              <p className="font-['Outfit',sans-serif] text-[12px] text-gray-600">
                One moment while we confirm with the payment provider.
              </p>
            </div>
          )}

          {state === 'settled' && isPaid && order && (
            <>
              <p className="font-['Outfit',sans-serif] text-[13px] leading-relaxed text-gray-700">
                Your payment is confirmed and a receipt is on its way to your email.
              </p>

              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-[#fff8f0] p-4 font-['Outfit',sans-serif] text-[12px]">
                <dt className="font-semibold text-gray-500">Reference</dt>
                <dd className="font-bold text-gray-900">{order.orderRef}</dd>

                <dt className="font-semibold text-gray-500">Item</dt>
                <dd className="text-gray-900">{order.productLabel}</dd>

                <dt className="font-semibold text-gray-500">Seats</dt>
                <dd className="text-gray-900">{order.seats}</dd>

                {/* Shown only when a code was used, and taken from the order
                    rather than from anything the browser remembers - this
                    dialog can be opened on a fresh page load with only ?ref. */}
                {order.discountAmountCents > 0 && (
                  <>
                    <dt className="font-semibold text-gray-500">Subtotal</dt>
                    <dd className="text-gray-900">
                      {formatMoney(order.subtotalAmountCents, order.currency)}
                    </dd>

                    <dt className="font-semibold text-green-700">
                      {order.discountLabel ?? 'Discount'}
                    </dt>
                    <dd className="text-green-700">
                      &minus;
                      {formatMoney(order.discountAmountCents, order.currency)}
                      {order.discountCode && (
                        <span className="text-gray-500">
                          {' '}
                          ({order.discountCode})
                        </span>
                      )}
                    </dd>
                  </>
                )}

                <dt className="font-semibold text-gray-500">Paid</dt>
                <dd className="font-bold text-gray-900">
                  {formatMoney(order.totalAmountCents, order.currency)}
                  {order.cardBrand && order.cardLast4 && (
                    <span className="font-normal text-gray-500">
                      {' '}
                      &middot; {order.cardBrand} &bull;&bull;&bull;&bull;{' '}
                      {order.cardLast4}
                    </span>
                  )}
                </dd>
              </dl>

              {order.deductibleAmountCents > 0 && (
                <p className="mt-3 border-l-[3px] border-[#e98314] bg-[#fff8f0] px-3 py-2 font-['Outfit',sans-serif] text-[11px] leading-relaxed text-gray-600">
                  Approximately{' '}
                  <strong>
                    {formatMoney(order.deductibleAmountCents, order.currency)}
                  </strong>{' '}
                  of this contribution may be tax-deductible, after the value of
                  the benefits you receive. Your emailed acknowledgement has the
                  full details.
                </p>
              )}

              <p className="mt-4 font-['Outfit',sans-serif] text-[11px] text-gray-500">
                Please keep your reference and bring it with you to the event.
              </p>
            </>
          )}

          {state === 'settled' && failed && (
            <>
              <p className="font-['Outfit',sans-serif] text-[13px] leading-relaxed text-gray-700">
                Your payment was not completed, so you have not been charged. You
                are welcome to try again, or contact us and we will help.
              </p>
              <ContactBlock />
            </>
          )}

          {state === 'settled' && isRefunded && order && (
            <p className="font-['Outfit',sans-serif] text-[13px] leading-relaxed text-gray-700">
              This payment of {formatMoney(order.totalAmountCents, order.currency)}{' '}
              has been refunded. Reference {order.orderRef}.
            </p>
          )}

          {state === 'still-pending' && (
            <>
              <p className="font-['Outfit',sans-serif] text-[13px] leading-relaxed text-gray-700">
                Your payment is taking longer than usual to confirm. If it went
                through, your receipt will still arrive by email &mdash; nothing is
                lost. Please do not pay a second time.
              </p>
              {order && (
                <p className="mt-3 rounded-lg bg-[#fff8f0] px-4 py-3 font-['Outfit',sans-serif] text-[12px]">
                  <span className="font-semibold text-gray-500">Reference: </span>
                  <span className="font-bold text-gray-900">{order.orderRef}</span>
                </p>
              )}
              <ContactBlock />
            </>
          )}

          {state === 'error' && (
            <>
              <p className="font-['Outfit',sans-serif] text-[13px] leading-relaxed text-gray-700">
                We could not reach the server to check your payment. If you
                completed payment, it has been recorded &mdash; please do not pay
                again. Quote reference <strong>{orderRef}</strong> if you contact
                us.
              </p>
              <ContactBlock />
            </>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="mt-5 w-full rounded-md py-2.5 font-['Outfit',sans-serif] text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: GOLD }}
          >
            {isPaid ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactBlock() {
  return (
    <div className="mt-4 space-y-1.5 rounded-lg bg-gray-50 p-4">
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
  );
}

export default PaymentReturn;
