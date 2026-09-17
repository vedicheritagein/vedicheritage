/**
 * The one place the page reports anything.
 *
 * Two sinks sit behind this: the Meta pixel (lib/pixel.ts) and Google
 * Analytics 4 (lib/analytics.ts). Each is independently switched on by its own
 * environment variable and each is separately a no-op when unset, so a build
 * can run either, both or neither - neither being what dev, test and preview
 * builds do.
 *
 * Call sites use Meta's event vocabulary, because that is what the site was
 * already instrumented with and because Meta's names are the stricter set. The
 * translation to GA4's names and parameters happens here, once, rather than
 * every component having an opinion about two schemas.
 *
 * Events carry an optional event ID, passed through to the pixel as `eventID`.
 * Nothing consumes it yet; it is what a server-side Conversions API report
 * would be matched against, so that a browser event and a server event for the
 * same order collapse into one conversion rather than counting twice.
 */

import { gaEvent } from './analytics';
import * as pixel from './pixel';
import type { PurchaseDetails } from './pixel';

export type { PurchaseDetails };

/**
 * Meta's event names to GA4's.
 *
 * Only the events this site actually fires. Anything unmapped goes to GA4
 * under its Meta name converted to snake_case, which keeps a new event
 * reporting something useful rather than nothing while its proper GA4 name is
 * decided.
 */
const GA_EVENT_NAMES: Record<string, string> = {
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
  Contact: 'generate_lead',
  PageView: 'page_view'
};

function gaName(metaName: string): string {
  return (
    GA_EVENT_NAMES[metaName] ??
    metaName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
  );
}

/**
 * Meta's `custom_data` shape to GA4's.
 *
 * `value` and `currency` mean the same thing in both, so they pass straight
 * through - they are also the only two GA4 needs to attribute revenue. The
 * content fields become a single-entry `items` array, which is the shape GA4's
 * ecommerce reports read; anything else is dropped rather than guessed at,
 * since an unrecognised key in GA4 is a custom dimension nobody registered and
 * shows up nowhere.
 */
function gaParams(params: Record<string, unknown> = {}): Record<string, unknown> {
  const { value, currency, content_ids, content_name, content_type, num_items } =
    params as {
      value?: number;
      currency?: string;
      content_ids?: string[];
      content_name?: string;
      content_type?: string;
      num_items?: number;
    };

  const itemId = content_ids?.[0] ?? content_type;
  const items = itemId
    ? [
        {
          item_id: itemId,
          item_name: content_name ?? itemId,
          ...(typeof value === 'number' ? { price: value } : {}),
          quantity: num_items ?? 1
        }
      ]
    : undefined;

  return {
    ...(typeof value === 'number' ? { value } : {}),
    ...(currency ? { currency } : {}),
    ...(items ? { items } : {})
  };
}

/** Report one of Meta's standard events to every enabled sink. */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  pixel.trackEvent(name, params, eventId);
  gaEvent(gaName(name), gaParams(params));
}

/** Report an event of our own naming, for things Meta has no standard name for. */
export function trackCustom(name: string, params?: Record<string, unknown>): void {
  pixel.trackCustom(name, params);
  gaEvent(gaName(name), gaParams(params));
}

/**
 * Order references already reported as a Purchase, within this tab.
 *
 * The same reasoning as the guard inside lib/pixel.ts, but it has to live here
 * too, and it has to be the outer one: the payment return dialog polls every
 * two seconds, StrictMode mounts it twice, and `?ref=` survives a refresh, so
 * without this a single ticket would be reported to GA4 three or four times
 * over. Gating here rather than relying on the pixel's own guard also means
 * GA4 still reports correctly on a build with no pixel ID.
 */
const PURCHASE_KEY = 'vh:tracking:purchases';

function reportedPurchases(): string[] {
  try {
    const raw = window.sessionStorage.getItem(PURCHASE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    // Private-mode browsers throw on sessionStorage. Treating that as "nothing
    // reported yet" keeps tracking working; the event ID is then the only thing
    // preventing a duplicate, which is what it is there for.
    return [];
  }
}

function rememberPurchase(orderRef: string): void {
  try {
    window.sessionStorage.setItem(
      PURCHASE_KEY,
      JSON.stringify([...reportedPurchases(), orderRef])
    );
  } catch {
    /* ignored - see reportedPurchases */
  }
}

/**
 * Report a settled payment to every enabled sink, at most once per order.
 *
 * Returns true when the event was actually sent.
 */
export function trackPurchase(details: PurchaseDetails): boolean {
  if (reportedPurchases().includes(details.orderRef)) return false;

  // Recorded before sending: if any sink throws we still must not retry on the
  // next poll two seconds from now.
  rememberPurchase(details.orderRef);

  pixel.trackPurchase(details);

  gaEvent('purchase', {
    transaction_id: details.orderRef,
    value: details.value,
    currency: details.currency,
    items: [
      {
        item_id: details.contentType,
        item_name: details.contentName,
        price: details.value / Math.max(details.quantity, 1),
        quantity: details.quantity
      }
    ]
  });

  return true;
}
