import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The pixel ID is read once, when the module is first evaluated, so each test
 * has to load a fresh copy after deciding what the environment should say.
 * That is what `vi.resetModules()` plus a dynamic import buys here.
 */
async function loadPixel(pixelId?: string) {
  vi.resetModules();
  if (pixelId === undefined) vi.stubEnv('VITE_META_PIXEL_ID', '');
  else vi.stubEnv('VITE_META_PIXEL_ID', pixelId);
  return import('./pixel');
}

const PURCHASE = {
  orderRef: 'VH-1234',
  value: 100,
  currency: 'USD',
  contentName: 'General Admission',
  contentType: 'ticket',
  quantity: 1
};

beforeEach(() => {
  window.sessionStorage.clear();
  delete window.fbq;
  delete window._fbq;
  document.querySelectorAll('script[src*="fbevents"]').forEach((s) => s.remove());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('with no pixel ID configured', () => {
  it('installs nothing and reports nothing', async () => {
    const pixel = await loadPixel();

    pixel.initPixel();

    expect(pixel.isPixelEnabled()).toBe(false);
    expect(window.fbq).toBeUndefined();
    expect(document.querySelector('script[src*="fbevents"]')).toBeNull();
    // The important one: a developer testing the payment flow locally must not
    // be able to report a sale into the live ad account.
    expect(pixel.trackPurchase(PURCHASE)).toBe(false);
  });
});

describe('with a pixel ID configured', () => {
  it('installs fbq and queues the init and PageView', async () => {
    const pixel = await loadPixel('123456789012345');

    pixel.initPixel();

    expect(pixel.isPixelEnabled()).toBe(true);
    expect(window.fbq).toBeTypeOf('function');
    expect(document.querySelector('script[src*="fbevents"]')).not.toBeNull();
    // fbevents.js has not loaded, so both calls should be waiting in the queue
    // for it to replay - that is the whole point of the stub.
    expect(window.fbq?.queue).toEqual([
      ['init', '123456789012345'],
      ['track', 'PageView']
    ]);
  });

  it('is idempotent, as StrictMode requires', async () => {
    const pixel = await loadPixel('123456789012345');

    pixel.initPixel();
    pixel.initPixel();

    expect(document.querySelectorAll('script[src*="fbevents"]')).toHaveLength(1);
    expect(window.fbq?.queue).toHaveLength(2);
  });

  it('reports a purchase once and ignores repeats of the same order', async () => {
    const pixel = await loadPixel('123456789012345');
    pixel.initPixel();
    const fbq = vi.fn();
    window.fbq = Object.assign(fbq, window.fbq!);

    expect(pixel.trackPurchase(PURCHASE)).toBe(true);
    // Stands in for a poll tick, a StrictMode double-mount and a page refresh -
    // every one of which re-runs the reporting effect for the same order.
    expect(pixel.trackPurchase(PURCHASE)).toBe(false);
    expect(pixel.trackPurchase(PURCHASE)).toBe(false);

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({ value: 100, currency: 'USD' }),
      // The order reference doubles as the event ID, so a Conversions API
      // report of the same order collapses into one conversion.
      { eventID: 'VH-1234' }
    );
  });

  it('still reports a different order', async () => {
    const pixel = await loadPixel('123456789012345');
    pixel.initPixel();

    expect(pixel.trackPurchase(PURCHASE)).toBe(true);
    expect(pixel.trackPurchase({ ...PURCHASE, orderRef: 'VH-9999' })).toBe(true);
  });

  it('survives a browser that refuses sessionStorage', async () => {
    const pixel = await loadPixel('123456789012345');
    pixel.initPixel();
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('private mode');
    });
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('private mode');
    });

    // Reporting must not throw; de-duplication then falls to the event ID.
    expect(() => pixel.trackPurchase(PURCHASE)).not.toThrow();
  });
});
