/**
 * Client for the payments API.
 *
 * The browser never sends an amount. It sends a SKU and a quantity, and the
 * server prices the order from its own catalogue - so editing anything in
 * devtools cannot change what is charged. Prices shown on the page come from
 * `fetchCatalogue` for the same reason: what the buyer sees is what the server
 * will charge.
 *
 * A discount code follows the same rule: the browser sends the CODE, and the
 * server decides what it is worth. `previewDiscount` exists only so the form
 * can show the saving before the buyer commits - it grants nothing, and the
 * checkout re-evaluates the code independently.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export type ProductKind = 'ticket' | 'sponsorship';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'refunded';

export interface CatalogueProduct {
  sku: string;
  kind: ProductKind;
  label: string;
  unitAmountCents: number;
  seatsPerUnit: number;
  maxQuantity: number;
}

export interface Catalogue {
  currency: string;
  products: CatalogueProduct[];
}

export interface CheckoutRequest {
  fullName: string;
  email: string;
  phone: string;
  /** City and state. Collected for sponsorships, omitted for tickets. */
  location?: string;
  sku: string;
  quantity: number;
  /** Discount code as typed, when one was applied. Never an amount. */
  discountCode?: string;
  idempotencyKey: string;
}

export interface CheckoutResponse {
  orderRef: string;
  checkoutUrl: string;
  subtotalAmountCents: number;
  discountCode: string | null;
  discountLabel: string | null;
  discountAmountCents: number;
  totalAmountCents: number;
  currency: string;
}

/** What a discount code is worth on a specific order, as priced by the server. */
export interface DiscountPreview {
  code: string | null;
  label: string | null;
  subtotalAmountCents: number;
  discountAmountCents: number;
  totalAmountCents: number;
  currency: string;
}

export interface OrderView {
  orderRef: string;
  status: OrderStatus;
  productLabel: string;
  productKind: string;
  quantity: number;
  seats: number;
  subtotalAmountCents: number;
  discountCode: string | null;
  discountLabel: string | null;
  discountAmountCents: number;
  totalAmountCents: number;
  deductibleAmountCents: number;
  currency: string;
  cardBrand: string | null;
  cardLast4: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** An error carrying the server's machine-readable code. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/** Format integer cents for display, e.g. 2000000 -> "$20,000". */
export function formatMoney(cents: number, currency = 'USD'): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2
  }).format(cents / 100);
}

/** Ten seconds: long enough for a cold start, short enough not to feel stuck. */
const REQUEST_TIMEOUT_MS = 10_000;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    // Offline, DNS failure, CORS rejection or timeout all land here.
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    throw new ApiError(
      timedOut ? 'timeout' : 'network_error',
      timedOut
        ? 'The request took too long. Please check your connection and try again.'
        : 'We could not reach the server. Please check your connection and try again.',
      0
    );
  }

  const text = await response.text();
  let payload: unknown;
  let parsed = true;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    // An unparseable body still has to be inspected for an error envelope
    // below, so it becomes an empty object - but the flag records that there
    // was nothing to read, because on a 2xx that is a failure, not a success.
    payload = {};
    parsed = false;
  }

  if (!response.ok) {
    // Two envelope shapes come back, and both have to be understood or the
    // buyer gets "Something went wrong" for a fixable typo:
    //
    //   { error, message }      - the payment handlers' own failures
    //                             (unknown_sku, location_required, ...)
    //   { errorCode, hint }     - node-server-engine's error middleware, which
    //                             is what every request-validation rejection
    //                             and the 404 handler produce. For a validation
    //                             failure `hint` is { field: message }.
    const body = payload as {
      error?: string;
      message?: string;
      errorCode?: string;
      hint?: unknown;
      errors?: unknown;
    };

    // Flatten the engine's hint object into one sentence.
    const hintMessage =
      body.hint && typeof body.hint === 'object'
        ? Object.values(body.hint as Record<string, unknown>)
            .filter((value): value is string => typeof value === 'string')
            .join(' ')
        : typeof body.hint === 'string'
          ? body.hint
          : undefined;

    // Raw express-validator output, in case anything answers with it directly.
    const validationMessage = Array.isArray(body.errors)
      ? (body.errors as Array<{ msg?: string }>)
          .map((item) => item.msg)
          .filter(Boolean)
          .join(' ')
      : undefined;

    throw new ApiError(
      body.error ?? body.errorCode ?? 'request_failed',
      body.message ??
        hintMessage ??
        validationMessage ??
        'Something went wrong. Please try again.',
      response.status
    );
  }

  if (!parsed) {
    // A 2xx carrying something that is not JSON means the request never
    // reached the API - a dev server answering with index.html, or a proxy or
    // captive portal in the way. Returning it as a value produced a page that
    // believed it had a price list of `undefined`, where every call to action
    // silently did nothing. Far better to fail here and let callers use their
    // fallback path.
    throw new ApiError(
      'invalid_response',
      'The server sent an unexpected response. Please try again.',
      response.status
    );
  }

  return payload as T;
}

export async function fetchCatalogue(): Promise<Catalogue> {
  const catalogue = await apiFetch<Catalogue>('/payments/products');

  // Shape check, not paranoia: everything downstream treats a loaded catalogue
  // as proof that a checkout can be started, so a response without a usable
  // product array must be rejected rather than half-accepted.
  if (!Array.isArray(catalogue?.products)) {
    throw new ApiError(
      'invalid_response',
      'The price list could not be read. Please try again.',
      200
    );
  }

  return catalogue;
}

export function startCheckout(body: CheckoutRequest): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * Ask the server what a discount code is worth on this order.
 *
 * Quoted against the SKU and quantity because that is what the code applies
 * to: a percentage needs a subtotal, and a code can carry a minimum. So the
 * quote has to be refreshed whenever the order changes, which is what the
 * effect in CheckoutModal does.
 */
export function previewDiscount(body: {
  code: string;
  sku: string;
  quantity: number;
  email?: string;
}): Promise<DiscountPreview> {
  return apiFetch<DiscountPreview>('/payments/discounts/preview', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function fetchOrder(orderRef: string): Promise<{ order: OrderView }> {
  return apiFetch<{ order: OrderView }>(
    `/payments/orders/${encodeURIComponent(orderRef)}`
  );
}

/**
 * Read the order reference the payment provider appended on the way back.
 *
 * Only the reference is trusted from this URL - never any status the query
 * string claims, since a buyer can type whatever they like into the address
 * bar. Whether the payment succeeded is always asked of the server.
 */
export function readReturnedOrderRef(): string | null {
  const ref = new URLSearchParams(window.location.search).get('ref');
  return ref && /^VH-[0-9A-F]{16}$/.test(ref) ? ref : null;
}

/** Remove the payment reference from the address bar without reloading. */
export function clearReturnedOrderRef(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('ref');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}
