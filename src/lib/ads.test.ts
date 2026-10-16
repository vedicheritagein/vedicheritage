import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ADS_ID = 'AW-1234567890';
const LEAD_LABEL = 'leadLabel123';
const PURCHASE_LABEL = 'purchaseLabel456';

/**
 * Every variable is read once, when the module is first evaluated, so each
 * test loads a fresh copy after deciding what the environment should say -
 * same arrangement as pixel.test.ts and analytics.test.ts. The fresh copy also
 * resets lib/gtag.ts's record of which IDs it has configured, which otherwise
 * leaks between tests.
 */
async function loadAds(env: { id?: string; lead?: string; purchase?: string } = {}) {
  vi.resetModules();
  vi.stubEnv('VITE_GOOGLE_ADS_ID', env.id ?? '');
  vi.stubEnv('VITE_GOOGLE_ADS_LEAD_LABEL', env.lead ?? '');
  vi.stubEnv('VITE_GOOGLE_ADS_PURCHASE_LABEL', env.purchase ?? '');
  return import('./ads');
}

beforeEach(() => {
  delete window.gtag;
  delete window.dataLayer;
  document
    .querySelectorAll('script[src*="googletagmanager"]')
    .forEach((s) => s.remove());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('with no account configured', () => {
  it('does nothing at all', async () => {
    const ads = await loadAds();

    ads.initAds();

    expect(ads.isAdsEnabled()).toBe(false);
    expect(window.gtag).toBeUndefined();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();

    // Must not throw, and must report that it sent nothing.
    expect(ads.adsLead()).toBe(false);
    expect(
      ads.adsPurchase({ orderRef: 'VH-1234', value: 100, currency: 'USD' })
    ).toBe(false);
  });
});

describe('with an account configured', () => {
  it('loads gtag.js and configures the account', async () => {
    const ads = await loadAds({ id: ADS_ID, lead: LEAD_LABEL });

    ads.initAds();

    expect(ads.isAdsEnabled()).toBe(true);
    expect(
      document
        .querySelector('script[src*="googletagmanager"]')
        ?.getAttribute('src')
    ).toBe(`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`);

    const queued = (window.dataLayer ?? []).map((entry) => Array.from(entry));
    expect(queued[0][0]).toBe('js');
    expect(queued[1]).toEqual(['config', ADS_ID]);
  });

  it('is idempotent, because StrictMode runs effects twice', async () => {
    const ads = await loadAds({ id: ADS_ID });

    ads.initAds();
    ads.initAds();

    expect(document.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);
    expect(window.dataLayer).toHaveLength(2);
  });

  it('addresses the lead conversion as account/label', async () => {
    const ads = await loadAds({ id: ADS_ID, lead: LEAD_LABEL });
    ads.initAds();
    const gtag = vi.fn();
    window.gtag = gtag;

    expect(ads.adsLead()).toBe(true);

    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: `${ADS_ID}/${LEAD_LABEL}`
    });
  });

  it('sends the order reference as transaction_id, so Google can deduplicate', async () => {
    const ads = await loadAds({ id: ADS_ID, purchase: PURCHASE_LABEL });
    ads.initAds();
    const gtag = vi.fn();
    window.gtag = gtag;

    expect(
      ads.adsPurchase({ orderRef: 'VH-1234', value: 200, currency: 'USD' })
    ).toBe(true);

    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: `${ADS_ID}/${PURCHASE_LABEL}`,
      value: 200,
      currency: 'USD',
      transaction_id: 'VH-1234'
    });
  });

  /**
   * The realistic half-configured build: the account is live and the lead
   * action exists, but nobody has created the purchase action in Ads yet.
   * Reporting it anyway would send a conversion addressed to no action.
   */
  it('stays silent about an action whose label is not set', async () => {
    const ads = await loadAds({ id: ADS_ID, lead: LEAD_LABEL });
    ads.initAds();
    const gtag = vi.fn();
    window.gtag = gtag;

    expect(ads.isLeadConversionEnabled()).toBe(true);
    expect(ads.isPurchaseConversionEnabled()).toBe(false);
    expect(
      ads.adsPurchase({ orderRef: 'VH-1234', value: 100, currency: 'USD' })
    ).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it('survives gtag throwing', async () => {
    const ads = await loadAds({ id: ADS_ID, lead: LEAD_LABEL });
    ads.initAds();
    window.gtag = () => {
      throw new Error('blocked by extension');
    };

    expect(() => ads.adsLead()).not.toThrow();
  });
});

describe('alongside Google Analytics', () => {
  /**
   * The reason lib/gtag.ts exists. Two `gtag/js` scripts on one page means two
   * libraries racing over one `dataLayer`, which double-counts conversions.
   */
  it('shares one gtag.js between the two accounts', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TESTID1234');
    vi.stubEnv('VITE_GOOGLE_ADS_ID', ADS_ID);
    vi.stubEnv('VITE_GOOGLE_ADS_LEAD_LABEL', LEAD_LABEL);

    const analytics = await import('./analytics');
    const ads = await import('./ads');

    analytics.initAnalytics();
    ads.initAds();

    expect(document.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);

    const queued = (window.dataLayer ?? []).map((entry) => Array.from(entry));
    expect(queued[0][0]).toBe('js');
    expect(queued[1]).toEqual(['config', 'G-TESTID1234']);
    expect(queued[2]).toEqual(['config', ADS_ID]);
  });

  it('configures Ads even when Analytics is off', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    vi.stubEnv('VITE_GOOGLE_ADS_ID', ADS_ID);

    const analytics = await import('./analytics');
    const ads = await import('./ads');

    analytics.initAnalytics();
    ads.initAds();

    expect(document.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);
    expect((window.dataLayer ?? []).map((e) => Array.from(e))[1]).toEqual([
      'config',
      ADS_ID
    ]);
  });
});
