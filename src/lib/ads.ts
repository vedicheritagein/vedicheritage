/**
 * Google Ads conversion tracking.
 *
 * A third sink alongside the Meta pixel and GA4, and the same contract as
 * both: a no-op unless `VITE_GOOGLE_ADS_ID` is set, and nothing here may throw.
 *
 * Google's setup page hands over two snippets - a `gtag/js` tag and an event
 * snippet - and tells you to paste both into `<head>`. Neither is pasted here,
 * for two different reasons:
 *
 *   - The tag would be a second copy of gtag.js, which GA4 already loads. One
 *     library, two IDs: lib/gtag.ts loads it once and configures each.
 *
 *   - The event snippet in `<head>` would fire on page load. That instruction
 *     assumes a multi-page site where arriving at `/thank-you.html` IS the
 *     conversion. This is a single-page app: there is no such URL, so pasting
 *     it there would report a lead for every visitor the moment they landed,
 *     and the lead count would equal the traffic count. The conversion is
 *     reported from the code path that actually converts instead, through
 *     lib/track.ts.
 *
 * A conversion is addressed as `AW-xxxxxxxxx/LABEL`. The ID identifies the Ads
 * account; the label identifies one conversion action defined inside it, and
 * each action needs its own label from Ads > Goals > Conversions > Summary.
 * They are separate variables rather than one pre-joined `send_to` string so a
 * second conversion action can be added without re-deriving the ID.
 *
 * Deliberately no personally identifiable information is sent, and enhanced
 * conversions are deliberately not enabled: that feature means passing the
 * buyer's email and phone number to Google, which needs a consent decision and
 * a privacy-policy change first, not just a flag.
 */

import { ensureGtag, gtagEvent } from './gtag';

/** The Ads account, `AW-xxxxxxxxx`. Public by design - it ships in the bundle. */
const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;

/** Conversion label for the "Website lead" action - the phone/email fallback. */
const LEAD_LABEL = import.meta.env.VITE_GOOGLE_ADS_LEAD_LABEL as string | undefined;

/**
 * Conversion label for a settled ticket or sponsorship payment.
 *
 * Separate from the lead label and separately optional, because it is a
 * different conversion action in Ads - one that carries a value, so Smart
 * Bidding can optimise for donation size rather than for lead count. A build
 * with the ID and only the lead label set reports leads and stays silent about
 * purchases, which is the correct behaviour until the action exists in Ads.
 */
const PURCHASE_LABEL = import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL as
  | string
  | undefined;

/** True when an Ads account was configured for this build. */
export function isAdsEnabled(): boolean {
  return Boolean(ADS_ID);
}

/** True when this build can report the named action - ID *and* label present. */
export function isLeadConversionEnabled(): boolean {
  return Boolean(ADS_ID && LEAD_LABEL);
}

export function isPurchaseConversionEnabled(): boolean {
  return Boolean(ADS_ID && PURCHASE_LABEL);
}

/**
 * Load gtag.js and configure the Ads account on it.
 *
 * Idempotent, and safe to call in either order with `initAnalytics` - whichever
 * runs first loads the library.
 *
 * Worth doing even on a page that never converts: `config` is what sets the
 * first-party `_gcl_aw` cookie from the `gclid` on an ad click. Without it the
 * conversion fired later has no click to be attributed to, and Google Ads
 * records a conversion it cannot credit to any campaign or keyword.
 */
export function initAds(): void {
  if (!ADS_ID) return;
  ensureGtag(ADS_ID);
}

/**
 * Report one conversion action.
 *
 * Returns true when the event was actually sent, which is what the tests
 * assert against and what makes "configured but silent" visible rather than
 * indistinguishable from "sent".
 */
export function adsConversion(
  label: string | undefined,
  params?: Record<string, unknown>
): boolean {
  if (!ADS_ID || !label) return false;

  gtagEvent('conversion', { send_to: `${ADS_ID}/${label}`, ...params });
  return true;
}

/** Report the "Website lead" conversion. */
export function adsLead(params?: Record<string, unknown>): boolean {
  return adsConversion(LEAD_LABEL, params);
}

export interface AdsPurchase {
  /** Doubles as Google's `transaction_id`. */
  orderRef: string;
  /** Major units, not cents - 100 for a $100 ticket. */
  value: number;
  currency: string;
}

/**
 * Report a settled payment as a conversion.
 *
 * `transaction_id` is what stops Google counting one order twice if the event
 * reaches it more than once - the guest refreshing the return page with `?ref=`
 * still in the address bar is the realistic way that happens. lib/track.ts
 * already guards against sending it twice from this tab; this covers the rest.
 */
export function adsPurchase(details: AdsPurchase): boolean {
  return adsConversion(PURCHASE_LABEL, {
    value: details.value,
    currency: details.currency,
    transaction_id: details.orderRef
  });
}
