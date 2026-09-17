import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const PIXEL_ID = '123456789012345';
const GA_ID = 'G-TESTID1234';

const PURCHASE = {
  orderRef: 'VH-1234',
  value: 100,
  currency: 'USD',
  contentName: 'General Admission',
  contentType: 'ticket',
  quantity: 1
};

/**
 * Each sink reads its own variable once at module evaluation, so a fresh copy
 * of the whole graph is loaded per test - the point of most of these tests
 * being which sinks fire for a given combination of variables.
 */
async function loadTrack(env: { pixel?: string; ga?: string }) {
  vi.resetModules();
  vi.stubEnv('VITE_META_PIXEL_ID', env.pixel ?? '');
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', env.ga ?? '');
  const track = await import('./track');
  const pixel = await import('./pixel');
  const analytics = await import('./analytics');
  pixel.initPixel();
  analytics.initAnalytics();
  // Replace the stubs the two init calls installed, so assertions see the
  // calls directly rather than having to read a replay queue.
  if (window.fbq) window.fbq = Object.assign(vi.fn(), window.fbq);
  if (window.gtag) window.gtag = vi.fn();
  return track;
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete window.fbq;
  delete window._fbq;
  delete window.gtag;
  delete window.dataLayer;
  document
    .querySelectorAll('script[src*="fbevents"], script[src*="googletagmanager"]')
    .forEach((s) => s.remove());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('with nothing configured', () => {
  it('reports to no sink and does not throw', async () => {
    const track = await loadTrack({});

    expect(() => track.trackEvent('InitiateCheckout', { value: 100 })).not.toThrow();
    expect(track.trackPurchase(PURCHASE)).toBe(true);

    expect(window.fbq).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });
});

describe('with both sinks configured', () => {
  it('passes the event ID to the pixel, for later server-side deduplication', async () => {
    const track = await loadTrack({ pixel: PIXEL_ID, ga: GA_ID });

    track.trackEvent('Contact', { content_name: 'fallback' }, 'evt-7');

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Contact',
      { content_name: 'fallback' },
      { eventID: 'evt-7' }
    );
  });

  it("translates Meta's event names and parameters into GA4's", async () => {
    const track = await loadTrack({ pixel: PIXEL_ID, ga: GA_ID });

    track.trackEvent('InitiateCheckout', {
      content_ids: ['ticket-ga'],
      content_name: 'General Admission',
      content_type: 'ticket',
      value: 100,
      currency: 'USD'
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'begin_checkout', {
      value: 100,
      currency: 'USD',
      items: [
        {
          item_id: 'ticket-ga',
          item_name: 'General Admission',
          price: 100,
          quantity: 1
        }
      ]
    });
  });

  it('reports a purchase to both, with GA4 ecommerce fields', async () => {
    const track = await loadTrack({ pixel: PIXEL_ID, ga: GA_ID });

    expect(track.trackPurchase(PURCHASE)).toBe(true);

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({ value: 100, currency: 'USD' }),
      { eventID: 'VH-1234' }
    );
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'purchase',
      expect.objectContaining({ transaction_id: 'VH-1234', value: 100 })
    );
  });

  it('reports each order once, however many times the return dialog polls', async () => {
    const track = await loadTrack({ pixel: PIXEL_ID, ga: GA_ID });

    expect(track.trackPurchase(PURCHASE)).toBe(true);
    expect(track.trackPurchase(PURCHASE)).toBe(false);
    expect(track.trackPurchase(PURCHASE)).toBe(false);

    expect(vi.mocked(window.fbq!)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(window.gtag!)).toHaveBeenCalledTimes(1);
  });

  it('still reports a different order', async () => {
    const track = await loadTrack({ pixel: PIXEL_ID, ga: GA_ID });

    expect(track.trackPurchase(PURCHASE)).toBe(true);
    expect(track.trackPurchase({ ...PURCHASE, orderRef: 'VH-9999' })).toBe(true);
  });

  it('sends a custom event to both, under GA4 snake_case', async () => {
    const track = await loadTrack({ pixel: PIXEL_ID, ga: GA_ID });

    track.trackCustom('AddToCalendar', { content_type: 'ticket' });

    expect(window.fbq).toHaveBeenCalledWith('trackCustom', 'AddToCalendar', {
      content_type: 'ticket'
    });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'add_to_calendar',
      expect.any(Object)
    );
  });
});

describe('with only one sink configured', () => {
  it('reports to GA4 on a build with no pixel ID', async () => {
    const track = await loadTrack({ ga: GA_ID });

    expect(track.trackPurchase(PURCHASE)).toBe(true);

    expect(window.fbq).toBeUndefined();
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });

  it('reports to the pixel on a build with no measurement ID', async () => {
    const track = await loadTrack({ pixel: PIXEL_ID });

    expect(track.trackPurchase(PURCHASE)).toBe(true);

    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.gtag).toBeUndefined();
  });
});
