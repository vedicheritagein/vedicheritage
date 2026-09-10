import { describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  clearReturnedOrderRef,
  fetchCatalogue,
  formatMoney,
  readReturnedOrderRef,
  startCheckout
} from './payments';

/** Stub `fetch` with one canned response. */
function stubFetch(init: {
  status?: number;
  body?: string;
  reject?: unknown;
}): ReturnType<typeof vi.fn> {
  const impl = init.reject
    ? vi.fn().mockRejectedValue(init.reject)
    : vi.fn().mockResolvedValue({
        ok: (init.status ?? 200) < 400,
        status: init.status ?? 200,
        text: () => Promise.resolve(init.body ?? '')
      });
  vi.stubGlobal('fetch', impl);
  return impl;
}

const CATALOGUE = JSON.stringify({
  currency: 'USD',
  products: [
    {
      sku: 'ticket-general',
      kind: 'ticket',
      label: 'General Admission',
      unitAmountCents: 10000,
      seatsPerUnit: 1,
      maxQuantity: 10
    }
  ]
});

describe('formatMoney', () => {
  it('drops the cents on whole amounts', () => {
    expect(formatMoney(2000000)).toBe('$20,000');
    expect(formatMoney(10000)).toBe('$100');
  });

  it('keeps the cents when there are any', () => {
    expect(formatMoney(10050)).toBe('$100.50');
  });
});

describe('fetchCatalogue', () => {
  it('returns the price list on success', async () => {
    stubFetch({ body: CATALOGUE });
    const catalogue = await fetchCatalogue();
    expect(catalogue.products).toHaveLength(1);
    expect(catalogue.products[0].unitAmountCents).toBe(10000);
  });

  it('rejects a 200 that is not JSON', async () => {
    // The dev server answers unknown paths with index.html at status 200. This
    // used to be swallowed into `{}`, which left the page believing it had a
    // price list of `undefined` - and every call to action silently did
    // nothing.
    stubFetch({ body: '<!doctype html><html></html>' });
    await expect(fetchCatalogue()).rejects.toMatchObject({
      code: 'invalid_response'
    });
  });

  it('rejects a JSON body with no product array', async () => {
    stubFetch({ body: JSON.stringify({ currency: 'USD' }) });
    await expect(fetchCatalogue()).rejects.toBeInstanceOf(ApiError);
  });

  it('reports a network failure as a network error', async () => {
    stubFetch({ reject: new TypeError('Failed to fetch') });
    await expect(fetchCatalogue()).rejects.toMatchObject({
      code: 'network_error'
    });
  });

  it('reports a timeout distinctly', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError');
    stubFetch({ reject: timeout });
    await expect(fetchCatalogue()).rejects.toMatchObject({ code: 'timeout' });
  });
});

describe('startCheckout', () => {
  const body = {
    fullName: 'Asha Iyer',
    email: 'asha@example.com',
    phone: '+16315550123',
    sku: 'ticket-general',
    quantity: 2,
    idempotencyKey: 'abcdefghijklmnop'
  };

  it('posts the order and returns the hosted checkout url', async () => {
    const fetchMock = stubFetch({
      status: 201,
      body: JSON.stringify({
        orderRef: 'VH-0123456789ABCDEF',
        checkoutUrl: 'https://squareup.com/checkout/abc',
        totalAmountCents: 20000,
        currency: 'USD'
      })
    });

    const result = await startCheckout(body);
    expect(result.checkoutUrl).toContain('squareup.com');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body as string);
    // The browser must never send an amount: the server prices the order.
    expect(sent).not.toHaveProperty('totalAmountCents');
    expect(sent).not.toHaveProperty('unitAmountCents');
    expect(sent.sku).toBe('ticket-general');
  });

  it('surfaces the handler error envelope { error, message }', async () => {
    stubFetch({
      status: 400,
      body: JSON.stringify({
        error: 'location_required',
        message: 'Please tell us your city and state.'
      })
    });

    await expect(startCheckout(body)).rejects.toMatchObject({
      code: 'location_required',
      message: 'Please tell us your city and state.'
    });
  });

  it('surfaces the engine validation envelope { errorCode, hint }', async () => {
    // The two envelopes are produced by different layers, and both have to be
    // understood or a fixable typo reads as "something went wrong".
    stubFetch({
      status: 400,
      body: JSON.stringify({
        errorCode: 'invalid-request',
        hint: { field: 'Enter a valid phone number' }
      })
    });

    await expect(startCheckout(body)).rejects.toMatchObject({
      code: 'invalid-request',
      message: 'Enter a valid phone number'
    });
  });

  it('does not show a raw server failure to the buyer', async () => {
    stubFetch({ status: 500, body: JSON.stringify({}) });
    await expect(startCheckout(body)).rejects.toMatchObject({
      message: 'Something went wrong. Please try again.'
    });
  });
});

describe('returned order reference', () => {
  function setSearch(search: string) {
    window.history.replaceState({}, '', `/${search}`);
  }

  it('accepts only a well-formed reference', () => {
    setSearch('?ref=VH-0123456789ABCDEF');
    expect(readReturnedOrderRef()).toBe('VH-0123456789ABCDEF');
  });

  it('ignores anything else in the address bar', () => {
    for (const value of [
      'VH-lowercase0000',
      "VH-1' OR '1'='1",
      '<script>alert(1)</script>',
      'VH-0123456789ABCDEFEXTRA',
      ''
    ]) {
      setSearch(`?ref=${encodeURIComponent(value)}`);
      expect(readReturnedOrderRef(), value).toBeNull();
    }
  });

  it('removes the reference from the url without reloading', () => {
    setSearch('?ref=VH-0123456789ABCDEF&utm=x');
    clearReturnedOrderRef();
    expect(window.location.search).not.toContain('ref=');
    expect(window.location.search).toContain('utm=x');
  });
});
