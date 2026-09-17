/**
 * Meta (Facebook) Pixel.
 *
 * Everything here is a no-op unless `VITE_META_PIXEL_ID` is set, which is the
 * single most important property of this module: a dev server, the test suite
 * and any preview build all run with it empty, so none of them can report a
 * fake ticket sale into the live ad account. Switching tracking on is a
 * deployment decision, not a code change.
 *
 * Nothing here may throw. A marketing page must not break because an ad
 * blocker removed `fbevents.js`, because a browser in private mode refused
 * `sessionStorage`, or because Meta's CDN is slow - so every entry point is
 * written to fail silently and let the page carry on.
 *
 * Deliberately no personally identifiable information is ever sent. The
 * checkout form collects a name, an email address and a phone number; none of
 * them belong in an event payload. If Advanced Matching is wanted later it
 * must go through `fbq('init', id, { em, ph })` with SHA-256 hashes, never
 * through the plaintext values.
 */

/** The pixel ID from Events Manager. Public by design - it ships in the bundle. */
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

const FBEVENTS_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

/**
 * The global `fbq` that Meta's own snippet installs.
 *
 * It is a function with properties: calls made before `fbevents.js` finishes
 * loading are pushed onto `queue`, and the library replays them once it has
 * attached its real implementation as `callMethod`. Reproducing that contract
 * exactly is what lets us call `trackEvent` immediately at startup without
 * waiting for the network.
 */
interface Fbq {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: unknown;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** True when a pixel ID was configured for this build. */
export function isPixelEnabled(): boolean {
  return Boolean(PIXEL_ID);
}

/**
 * Install the `fbq` stub and load Meta's library.
 *
 * Idempotent: calling it twice is harmless, which matters because React's
 * StrictMode runs effects twice in development.
 */
export function initPixel(): void {
  if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return;

  try {
    const fbq = function (this: unknown, ...args: unknown[]): void {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as Fbq;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    // Meta's snippet sets `push` to the function itself; fbevents.js relies on
    // it when it drains anything queued before it arrived.
    fbq.push = fbq;

    window.fbq = fbq;
    window._fbq ??= fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = FBEVENTS_SRC;
    document.head.appendChild(script);

    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
  } catch {
    // Silent on purpose. Analytics is never worth a broken page.
  }
}

/**
 * Report one of Meta's standard events (PageView, InitiateCheckout, Purchase...).
 *
 * `eventId` should be set wherever the same conversion may also be reported
 * server-side through the Conversions API: Meta treats a browser event and a
 * server event carrying the same ID as one conversion rather than two.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  if (!PIXEL_ID) return;
  try {
    window.fbq?.('track', name, params ?? {}, eventId ? { eventID: eventId } : undefined);
  } catch {
    /* ignored - see module comment */
  }
}

/** Report an event of our own naming, for things Meta has no standard name for. */
export function trackCustom(name: string, params?: Record<string, unknown>): void {
  if (!PIXEL_ID) return;
  try {
    window.fbq?.('trackCustom', name, params ?? {});
  } catch {
    /* ignored - see module comment */
  }
}

/**
 * Order references already reported as a Purchase, within this tab.
 *
 * Backed by `sessionStorage` rather than a module variable because the payment
 * return dialog is genuinely re-entrant: it polls the order every two seconds,
 * StrictMode mounts it twice in development, and the `?ref=` parameter stays in
 * the address bar until the guest dismisses it - so a refresh brings the whole
 * dialog back. Without this guard a single $100 ticket would be reported three
 * or four times and every cost-per-purchase figure in Events Manager would be
 * wrong.
 */
const PURCHASE_KEY = 'vh:meta-pixel:purchases';

function reportedPurchases(): string[] {
  try {
    const raw = window.sessionStorage.getItem(PURCHASE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    // Private-mode browsers throw on sessionStorage. Treating that as "nothing
    // reported yet" keeps tracking working; the eventID below is then the only
    // thing preventing a duplicate, which is what it is there for.
    return [];
  }
}

function rememberPurchase(orderRef: string): void {
  try {
    const next = [...reportedPurchases(), orderRef];
    window.sessionStorage.setItem(PURCHASE_KEY, JSON.stringify(next));
  } catch {
    /* ignored - see reportedPurchases */
  }
}

export interface PurchaseDetails {
  orderRef: string;
  /** Major units, not cents - Meta expects 100 for a $100 ticket. */
  value: number;
  currency: string;
  contentName: string;
  contentType: string;
  quantity: number;
}

/**
 * Report a settled payment, at most once per order reference.
 *
 * The order reference doubles as the Meta event ID, so if the Conversions API
 * is added to the backend webhook later it can send the same reference and the
 * two reports will collapse into one conversion automatically.
 *
 * Returns true when the event was actually sent, which is what the tests
 * assert against.
 */
export function trackPurchase(details: PurchaseDetails): boolean {
  if (!PIXEL_ID) return false;
  if (reportedPurchases().includes(details.orderRef)) return false;

  // Recorded before sending: if `fbq` throws for any reason we still must not
  // retry on the next poll two seconds from now.
  rememberPurchase(details.orderRef);

  trackEvent(
    'Purchase',
    {
      value: details.value,
      currency: details.currency,
      content_name: details.contentName,
      content_type: details.contentType,
      contents: [{ id: details.contentType, quantity: details.quantity }],
      num_items: details.quantity
    },
    details.orderRef
  );

  return true;
}
