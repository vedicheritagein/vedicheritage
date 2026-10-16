/**
 * Google Analytics 4.
 *
 * Same contract as lib/pixel.ts and for the same reasons: a no-op unless
 * `VITE_GA_MEASUREMENT_ID` is set, so the dev server, the test suite and any
 * preview build report nothing into the live property; and nothing here may
 * throw, because a marketing page must survive an ad blocker eating
 * gtag/js, a browser refusing third-party scripts, or Google's CDN being slow.
 *
 * The gtag.js bootstrap itself lives in lib/gtag.ts, shared with Google Ads
 * (lib/ads.ts) - the two products are one library with two IDs, and loading it
 * twice would split the GA4 session and double-count Ads conversions.
 *
 * No personally identifiable information is sent. The checkout form collects a
 * name, an email address and a phone number; none of them belong in an event
 * payload, and GA4's terms forbid them outright.
 */

import { ensureGtag, gtagEvent } from './gtag';

/** The measurement ID (`G-XXXXXXX`). Public by design - it ships in the bundle. */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

/** True when a measurement ID was configured for this build. */
export function isAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID);
}

/**
 * Load gtag.js and configure the GA4 property on it.
 *
 * Idempotent, which matters because React's StrictMode runs effects twice in
 * development. The stub installed by lib/gtag.ts pushes onto `dataLayer`
 * exactly as Google's own snippet does, so events fired before gtag.js has
 * finished downloading are replayed rather than lost - that is what lets the
 * rest of the app call `gaEvent` immediately at startup without waiting for
 * the network.
 */
export function initAnalytics(): void {
  if (!MEASUREMENT_ID) return;
  ensureGtag(MEASUREMENT_ID);
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
  gtagEvent(name, params);
}
