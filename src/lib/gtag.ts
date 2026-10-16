/**
 * The gtag.js loader, shared by Google Analytics 4 and Google Ads.
 *
 * Both products are the same library with different IDs: one `gtag/js` script,
 * one `dataLayer`, one `gtag()` function, and then a `config` call per ID. They
 * are separate sinks in this codebase (lib/analytics.ts, lib/ads.ts) because
 * each is switched on by its own variable and each means something different,
 * but they must not each install their own copy - two `gtag/js` scripts on a
 * page is how a conversion gets counted twice and how the GA4 session gets
 * split in half.
 *
 * So the bootstrap lives here and is idempotent per ID. Whichever sink
 * initialises first loads the script; the other finds `window.gtag` already
 * present and only adds its own `config`.
 *
 * Nothing here may throw. A marketing page must not break because an ad
 * blocker removed `gtag/js` or because a browser refused third-party scripts.
 */

const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js?id=';

type DataLayerEntry = IArguments | unknown[];

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * IDs already configured on this page.
 *
 * Per ID rather than a single "installed" flag, because the second sink to
 * initialise still has work to do - its `config` - even though the script is
 * already there. React's StrictMode runs effects twice, so both paths have to
 * tolerate being called again.
 */
const configured = new Set<string>();

/**
 * Install gtag.js if it is not already there, and configure `id` on it.
 *
 * Safe to call with the same ID any number of times.
 */
export function ensureGtag(id: string): void {
  if (!id || typeof window === 'undefined' || configured.has(id)) return;

  try {
    if (!window.gtag) {
      window.dataLayer ??= [];
      // Must push `arguments` itself, not a copy: gtag.js identifies its own
      // queued calls by the Arguments object and ignores plain arrays, so rest
      // parameters here would silently drop every event fired before gtag.js
      // finished loading. This is Google's own snippet, reproduced exactly.
      // eslint-disable-next-line prefer-rest-params
      window.gtag = function gtag() { window.dataLayer?.push(arguments); };

      const script = document.createElement('script');
      script.async = true;
      script.src = GTAG_SRC + encodeURIComponent(id);
      document.head.appendChild(script);

      window.gtag('js', new Date());
    }

    window.gtag('config', id);
    configured.add(id);
  } catch {
    // Silent on purpose. Analytics is never worth a broken page.
  }
}

/** True once `ensureGtag` has configured this ID on the page. */
export function isGtagConfigured(id: string): boolean {
  return configured.has(id);
}

/**
 * Send one event through `gtag`.
 *
 * Fails silently, by the module contract above: a blocked or missing `gtag` is
 * a normal condition on a real audience, not an error worth surfacing.
 */
export function gtagEvent(name: string, params?: Record<string, unknown>): void {
  try {
    window.gtag?.('event', name, params ?? {});
  } catch {
    /* ignored - see module comment */
  }
}
