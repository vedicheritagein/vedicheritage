/**
 * Google Analytics 4.
 *
 * Same contract as lib/pixel.ts and for the same reasons: a no-op unless
 * `VITE_GA_MEASUREMENT_ID` is set, so the dev server, the test suite and any
 * preview build report nothing into the live property; and nothing here may
 * throw, because a marketing page must survive an ad blocker eating
 * gtag/js, a browser refusing third-party scripts, or Google's CDN being slow.
 *
 * No personally identifiable information is sent. The checkout form collects a
 * name, an email address and a phone number; none of them belong in an event
 * payload, and GA4's terms forbid them outright.
 */

/** The measurement ID (`G-XXXXXXX`). Public by design - it ships in the bundle. */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js?id=';

type DataLayerEntry = IArguments | unknown[];

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** True when a measurement ID was configured for this build. */
export function isAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID);
}

/**
 * Install the `gtag` stub and load Google's library.
 *
 * Idempotent, which matters because React's StrictMode runs effects twice in
 * development. The stub pushes onto `dataLayer` exactly as Google's own
 * snippet does, so events fired before gtag.js has finished downloading are
 * replayed rather than lost - that is what lets the rest of the app call
 * `gaEvent` immediately at startup without waiting for the network.
 */
export function initAnalytics(): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || window.gtag) return;

  try {
    window.dataLayer ??= [];
    // Must push `arguments` itself, not a copy: gtag.js identifies its own
    // queued calls by the Arguments object and ignores plain arrays, so rest
    // parameters here would silently drop every event fired before gtag.js
    // finished loading. This is Google's own snippet, reproduced exactly.
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function gtag() { window.dataLayer?.push(arguments); };

    const script = document.createElement('script');
    script.async = true;
    script.src = GTAG_SRC + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID);
  } catch {
    // Silent on purpose. Analytics is never worth a broken page.
  }
}

/**
 * Report a GA4 event.
 *
 * `params` uses GA4's own vocabulary (`value`, `currency`, `items`, ...) rather
 * than Meta's, so callers translate once at the call site instead of every
 * report being a guess about which schema won.
 */
export function gaEvent(name: string, params?: Record<string, unknown>): void {
  if (!MEASUREMENT_ID) return;
  try {
    window.gtag?.('event', name, params ?? {});
  } catch {
    /* ignored - see module comment */
  }
}
