import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The measurement ID is read once, when the module is first evaluated, so each
 * test has to load a fresh copy after deciding what the environment should
 * say - same arrangement as pixel.test.ts.
 */
async function loadAnalytics(measurementId?: string) {
  vi.resetModules();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', measurementId ?? '');
  return import('./analytics');
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

describe('with no measurement ID configured', () => {
  it('does nothing at all', async () => {
    const ga = await loadAnalytics();

    ga.initAnalytics();

    expect(ga.isAnalyticsEnabled()).toBe(false);
    expect(window.gtag).toBeUndefined();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();

    // Must not throw even though nothing was installed.
    expect(() => ga.gaEvent('purchase', { value: 100 })).not.toThrow();
  });
});

describe('with a measurement ID configured', () => {
  it('installs gtag and queues the js and config calls', async () => {
    const ga = await loadAnalytics('G-TESTID1234');

    ga.initAnalytics();

    expect(ga.isAnalyticsEnabled()).toBe(true);
    expect(window.gtag).toBeTypeOf('function');
    expect(
      document
        .querySelector('script[src*="googletagmanager"]')
        ?.getAttribute('src')
    ).toBe('https://www.googletagmanager.com/gtag/js?id=G-TESTID1234');

    const queued = (window.dataLayer ?? []).map((entry) => Array.from(entry));
    expect(queued[0][0]).toBe('js');
    expect(queued[1]).toEqual(['config', 'G-TESTID1234']);
  });

  it('is idempotent, because StrictMode runs effects twice', async () => {
    const ga = await loadAnalytics('G-TESTID1234');

    ga.initAnalytics();
    ga.initAnalytics();

    expect(document.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);
    expect(window.dataLayer).toHaveLength(2);
  });

  it('sends events through gtag', async () => {
    const ga = await loadAnalytics('G-TESTID1234');
    ga.initAnalytics();
    const gtag = vi.fn();
    window.gtag = gtag;

    ga.gaEvent('purchase', { value: 100, currency: 'USD' });

    expect(gtag).toHaveBeenCalledWith('event', 'purchase', {
      value: 100,
      currency: 'USD'
    });
  });

  it('survives gtag throwing', async () => {
    const ga = await loadAnalytics('G-TESTID1234');
    ga.initAnalytics();
    window.gtag = () => {
      throw new Error('blocked by extension');
    };

    expect(() => ga.gaEvent('purchase')).not.toThrow();
  });
});
