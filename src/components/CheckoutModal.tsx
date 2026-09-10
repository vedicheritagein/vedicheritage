import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  formatMoney,
  previewDiscount,
  startCheckout,
  type CatalogueProduct,
  type DiscountPreview
} from '../lib/payments';

export interface CheckoutModalProps {
  /** Product the form opens on. Null closes the modal. */
  product: CatalogueProduct | null;
  /**
   * Every sponsorship tier, highest first.
   *
   * Passed in rather than fetched here so the selector offers exactly the tiers
   * the server prices, and a sponsor who opened the wrong card can switch tier
   * without closing the form and losing what they have typed.
   */
  sponsorshipOptions?: CatalogueProduct[];
  onClose: () => void;
}

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  quantity?: string;
}

const MAROON = '#4A0D12';
const GOLD = '#e98314';

/**
 * Validate on the client to give immediate, specific feedback.
 *
 * This mirrors the server rules but is not a substitute for them - the server
 * validates independently, because anything enforced only in a browser is not
 * enforced at all.
 */
function validate(
  values: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    quantity: number;
  },
  product: CatalogueProduct
): FieldErrors {
  const errors: FieldErrors = {};

  const name = values.fullName.trim();
  if (name.length < 2) {
    errors.fullName = 'Please enter your full name.';
  } else if (name.length > 120) {
    errors.fullName = 'Please use 120 characters or fewer.';
  } else if (/[\r\n\t<>]/.test(name)) {
    errors.fullName = 'Please remove any special characters.';
  }

  // Deliberately permissive: the server and the payment provider both check
  // again, and an over-strict pattern rejects real addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  // Count digits and whitelist characters, but do not police the arrangement:
  // "(631) 805-9105" is how a great many people write a US number, and the
  // previous pattern required a digit first, so it rejected that with a message
  // that said brackets were allowed. Upper bound is 15, the most E.164 permits.
  // The server normalises to E.164 before handing anything to the provider.
  const digits = values.phone.replace(/[^0-9]/g, '');
  if (digits.length < 7) {
    errors.phone = 'Please enter a valid phone number.';
  } else if (digits.length > 15) {
    errors.phone = 'Please check that phone number.';
  } else if (!/^[+0-9\s().-]+$/.test(values.phone.trim())) {
    errors.phone = 'Use digits, spaces, brackets, dots and dashes only.';
  }

  // City and state are what recognition (plaques, the programme booklet) is
  // printed with, so they are asked for on a sponsorship and left out of a
  // plain ticket purchase, where they would be one more field for nothing.
  if (product.kind === 'sponsorship') {
    const location = values.location.trim();
    if (location.length < 2) {
      errors.location = 'Please enter your city and state.';
    } else if (location.length > 160) {
      errors.location = 'Please use 160 characters or fewer.';
    } else if (/[\r\n\t<>]/.test(location)) {
      errors.location = 'Please remove any special characters.';
    }
  }

  if (!Number.isInteger(values.quantity) || values.quantity < 1) {
    errors.quantity = 'Choose at least one.';
  } else if (values.quantity > product.maxQuantity) {
    errors.quantity = `At most ${product.maxQuantity} per order.`;
  }

  return errors;
}

export function CheckoutModal({
  product,
  sponsorshipOptions = [],
  onClose
}: CheckoutModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  // Which tier is being bought. Seeded from the card that opened the form and
  // owned here, so switching tier re-prices the order without remounting.
  const [selectedSku, setSelectedSku] = useState(product?.sku ?? '');
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Discount code state.
  //
  // `codeInput` is what is being typed; `appliedCode` is what the buyer has
  // asked us to use. They are separate so typing does not fire a request per
  // keystroke, and so a code stays applied while the buyer edits other fields.
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  /**
   * The server's quote, tagged with the order it was calculated for.
   *
   * The saving shown is always the server's arithmetic and never ours - which
   * is what stops the form promising a discount the checkout would not honour.
   * Storing the tag makes "are we still waiting?" a derived value rather than
   * another piece of state to keep in step, and means a saving can never be
   * rendered against an order it was not quoted for.
   */
  const [quote, setQuote] = useState<{
    key: string;
    preview: DiscountPreview;
  } | null>(null);

  /**
   * Latest email, without making it a dependency of the quote.
   *
   * A once-per-person code needs the address to check, but re-quoting on every
   * keystroke of an email field would be absurd - and the authoritative check
   * happens at checkout, where the address is always present.
   */
  const emailRef = useRef('');
  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  /**
   * Idempotency key, held stable for a given payload.
   *
   * A retry of the same details must reuse the key so the server returns the
   * existing checkout rather than creating a second one. Changing the details
   * is a genuinely different order, so it earns a fresh key - otherwise
   * correcting a quantity would silently re-send you to the old amount.
   */
  const idempotency = useRef<{ signature: string; key: string } | null>(null);

  const keyFor = useCallback((signature: string): string => {
    if (idempotency.current?.signature === signature) {
      return idempotency.current.key;
    }
    const key = crypto.randomUUID();
    idempotency.current = { signature, key };
    return key;
  }, []);

  const isOpen = product !== null;

  // No reset effect is needed: CheckoutProvider keys this component by SKU, so
  // choosing a different product remounts it with fresh state.

  // Remember what had focus, move focus into the dialog, and restore on close.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 10);
    return () => {
      window.clearTimeout(timer);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // Stop the page behind the dialog from scrolling.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape to close, and keep Tab inside the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, submitting, onClose]);

  // What is actually being bought: the tier chosen in the selector, falling
  // back to the product the form was opened with. Everything below - the total,
  // the validation rules, the SKU sent to the server - reads from this, so the
  // amount on screen can never disagree with the tier selected.
  const activeProduct = useMemo(() => {
    if (!product) return null;
    if (product.kind !== 'sponsorship') return product;
    return (
      sponsorshipOptions.find((option) => option.sku === selectedSku) ?? product
    );
  }, [product, sponsorshipOptions, selectedSku]);

  const subtotalCents = useMemo(
    () => (activeProduct ? activeProduct.unitAmountCents * quantity : 0),
    [activeProduct, quantity]
  );

  const activeSku = activeProduct?.sku;

  /**
   * Whether a discount code is offered for what is being bought.
   *
   * Tickets only. A sponsorship is a charitable gift rather than a purchase, so
   * every code in the server catalogue is ticket-only and one entered on a
   * sponsorship could only ever be refused - offering the field there just
   * invites sponsors to hunt for a code that does not exist. The server stays
   * the authority either way; this only stops the form asking a question that
   * has no good answer.
   */
  const discountsApply = activeProduct?.kind === 'ticket';

  /** The order a quote would have to describe to be usable right now. */
  const quoteKey =
    appliedCode && activeSku && discountsApply
      ? `${appliedCode}|${activeSku}|${quantity}`
      : null;

  /** True while the server has not yet priced the order on screen. */
  const checkingCode = quoteKey !== null && quote?.key !== quoteKey;

  /**
   * Quote the applied code against the order as it currently stands.
   *
   * This is the only place a quote is fetched, including for the Apply button -
   * which just records the code and lets this run. So changing the quantity
   * re-prices the discount rather than leaving a stale saving on screen, and
   * there is one code path to reason about instead of two.
   *
   * A code that no longer applies (below its minimum after the quantity was
   * lowered, expired while the form sat open) is taken off the form with the
   * server's own explanation, rather than silently ignored at submit.
   */
  useEffect(() => {
    if (!appliedCode || !activeSku || quoteKey === null) return;
    // Already priced for this exact order.
    if (quote?.key === quoteKey) return;

    let cancelled = false;

    previewDiscount({
      code: appliedCode,
      sku: activeSku,
      quantity,
      email: emailRef.current.trim().toLowerCase() || undefined
    })
      .then((preview) => {
        if (cancelled) return;
        setQuote({ key: quoteKey, preview });
        setCodeError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setQuote(null);
        setAppliedCode(null);
        setCodeError(
          error instanceof ApiError
            ? error.message
            : 'We could not check that code. Please try again.'
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appliedCode, activeSku, quantity, quoteKey, quote?.key]);

  /**
   * Whether there is a saving to show for the order on screen.
   *
   * The subtotal comparison is a second lock on top of the quote key: the
   * server's arithmetic wins, so if it ever priced a different subtotal than
   * the catalogue shows, nothing is claimed rather than something wrong.
   */
  const discountShown =
    !checkingCode &&
    quote !== null &&
    quote.preview.discountAmountCents > 0 &&
    quote.preview.subtotalAmountCents === subtotalCents;

  /** What the buyer will actually be charged. */
  const payableCents = discountShown
    ? quote.preview.totalAmountCents
    : subtotalCents;

  // Errors are computed during render rather than mirrored into state: they are
  // a pure function of the current values, and storing them would need an
  // effect to keep the copy in step. Shown only after a first submit, so the
  // form does not scold anyone for a field they have not finished typing.
  const visibleErrors: FieldErrors =
    submitted && activeProduct
      ? validate({ fullName, email, phone, location, quantity }, activeProduct)
      : {};

  if (!product || !activeProduct) return null;

  const isTicket = activeProduct.kind === 'ticket';
  const isSponsorship = activeProduct.kind === 'sponsorship';
  const allowsQuantity = activeProduct.maxQuantity > 1;
  const showTierSelect = isSponsorship && sponsorshipOptions.length > 1;

  /** Record the typed code; the effect above does the asking. */
  const handleApplyCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (code === '' || checkingCode) return;
    setCodeError(null);
    setCodeInput(code);
    setAppliedCode(code);
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setQuote(null);
    setCodeError(null);
    setCodeInput('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Not while a quote is in flight: the buyer would be agreeing to a total
    // that is about to change on screen.
    if (submitting || checkingCode) return;

    setSubmitted(true);
    setFormError(null);

    const values = { fullName, email, phone, location, quantity };
    const found = validate(values, activeProduct);

    if (Object.keys(found).length > 0) {
      // Move focus to the first problem so a screen reader announces it.
      const firstKey = Object.keys(found)[0];
      dialogRef.current
        ?.querySelector<HTMLElement>(`[name="${firstKey}"]`)
        ?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const signature = JSON.stringify({
        sku: activeProduct.sku,
        quantity,
        email: email.trim().toLowerCase(),
        location: location.trim(),
        // Part of the signature: applying or removing a code is a different
        // order, and reusing the key would send the buyer back to the amount
        // they had before.
        discountCode: appliedCode ?? ''
      });

      const result = await startCheckout({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        // Only sent where it is asked for, so a ticket buyer's order carries no
        // empty string pretending to be an address.
        location: isSponsorship ? location.trim() : undefined,
        sku: activeProduct.sku,
        quantity,
        // The code only, and only where codes are offered. What it is worth is
        // the server's decision, which it makes again rather than trusting the
        // quote above.
        discountCode: (isTicket ? appliedCode : null) ?? undefined,
        idempotencyKey: keyFor(signature)
      });

      // Hand off to the provider's hosted page. Kept as a full navigation
      // rather than a popup so it survives strict popup blockers.
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setSubmitting(false);

      // A code the server refused has to come off the form, or the buyer sees a
      // discounted total they can never be charged and every retry fails the
      // same way. Their next click then goes through at the honest price.
      if (
        error instanceof ApiError &&
        (error.code === 'invalid_discount_code' ||
          error.code.startsWith('discount_'))
      ) {
        setAppliedCode(null);
        setQuote(null);
        setCodeError(error.message);
        setFormError(null);
        return;
      }

      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    }
  };

  const fieldClass = (hasError: boolean) =>
    [
      "w-full rounded-md border px-3 py-2.5 text-sm font-['Outfit',sans-serif]",
      'text-gray-900 placeholder:text-gray-400 bg-white',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      hasError
        ? 'border-red-500 focus:ring-red-400'
        : 'border-gray-300 focus:ring-[#e98314]'
    ].join(' ');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      // Clicking the backdrop closes, but never mid-submission - losing a form
      // by a stray click while a payment is starting would be unforgivable.
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="my-auto w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 rounded-t-2xl px-6 py-5"
          style={{ backgroundColor: MAROON }}
        >
          <div>
            <h2
              id={titleId}
              className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-lg font-normal text-[#FFD238]"
            >
              {isTicket ? 'Book Your Tickets' : 'Confirm Your Sponsorship'}
            </h2>
            <p className="mt-1 font-['Outfit',sans-serif] text-[11px] text-[#FFF5ED]/80">
              {activeProduct.label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-[#FFF5ED] transition hover:bg-white/10 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5">
          <div className="space-y-4">
            {showTierSelect && (
              <div>
                <label
                  htmlFor="checkout-tier"
                  className="mb-1.5 block font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                >
                  Choose your sponsorship tier
                </label>
                <select
                  id="checkout-tier"
                  name="sku"
                  value={activeProduct.sku}
                  onChange={(event) => setSelectedSku(event.target.value)}
                  className={fieldClass(false)}
                >
                  {sponsorshipOptions.map((option) => (
                    <option key={option.sku} value={option.sku}>
                      {/* Amounts come from the same server catalogue that prices
                          the order, so the label cannot drift from the charge. */}
                      {option.label} - {formatMoney(option.unitAmountCents)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 font-['Outfit',sans-serif] text-[11px] text-gray-500">
                  {activeProduct.seatsPerUnit} complimentary seat
                  {activeProduct.seatsPerUnit === 1 ? '' : 's'} included.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="checkout-name"
                className="mb-1.5 block font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600"
              >
                Full name
              </label>
              <input
                ref={firstFieldRef}
                id="checkout-name"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                aria-invalid={Boolean(visibleErrors.fullName)}
                aria-describedby={
                  visibleErrors.fullName ? 'checkout-name-error' : undefined
                }
                className={fieldClass(Boolean(visibleErrors.fullName))}
                placeholder="Your name"
              />
              {visibleErrors.fullName && (
                <p
                  id="checkout-name-error"
                  className="mt-1 font-['Outfit',sans-serif] text-[11px] text-red-600"
                >
                  {visibleErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="checkout-email"
                className="mb-1.5 block font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600"
              >
                Email
              </label>
              <input
                id="checkout-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(visibleErrors.email)}
                aria-describedby="checkout-email-hint"
                className={fieldClass(Boolean(visibleErrors.email))}
                placeholder="you@example.com"
              />
              <p
                id="checkout-email-hint"
                className="mt-1 font-['Outfit',sans-serif] text-[11px] text-gray-500"
              >
                {visibleErrors.email ? (
                  <span className="text-red-600">{visibleErrors.email}</span>
                ) : (
                  'Your receipt and confirmation are sent here.'
                )}
              </p>
            </div>

            <div>
              <label
                htmlFor="checkout-phone"
                className="mb-1.5 block font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600"
              >
                Phone
              </label>
              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(visibleErrors.phone)}
                aria-describedby={
                  visibleErrors.phone ? 'checkout-phone-error' : undefined
                }
                className={fieldClass(Boolean(visibleErrors.phone))}
                placeholder="+1 631 555 0123"
              />
              {visibleErrors.phone && (
                <p
                  id="checkout-phone-error"
                  className="mt-1 font-['Outfit',sans-serif] text-[11px] text-red-600"
                >
                  {visibleErrors.phone}
                </p>
              )}
            </div>

            {isSponsorship && (
              <div>
                <label
                  htmlFor="checkout-location"
                  className="mb-1.5 block font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                >
                  Location
                </label>
                <input
                  id="checkout-location"
                  name="location"
                  type="text"
                  autoComplete="address-level2"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  aria-invalid={Boolean(visibleErrors.location)}
                  aria-describedby="checkout-location-hint"
                  className={fieldClass(Boolean(visibleErrors.location))}
                  placeholder="Hicksville, NY"
                />
                <p
                  id="checkout-location-hint"
                  className="mt-1 font-['Outfit',sans-serif] text-[11px] text-gray-500"
                >
                  {visibleErrors.location ? (
                    <span className="text-red-600">
                      {visibleErrors.location}
                    </span>
                  ) : (
                    'City and state, used for your sponsor recognition.'
                  )}
                </p>
              </div>
            )}

            {allowsQuantity && (
              <div>
                <label
                  htmlFor="checkout-quantity"
                  className="mb-1.5 block font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                >
                  Number of tickets
                </label>
                <select
                  id="checkout-quantity"
                  name="quantity"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className={fieldClass(Boolean(visibleErrors.quantity))}
                >
                  {Array.from({ length: activeProduct.maxQuantity }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
                {visibleErrors.quantity && (
                  <p className="mt-1 font-['Outfit',sans-serif] text-[11px] text-red-600">
                    {visibleErrors.quantity}
                  </p>
                )}
              </div>
            )}

            {/* Discount code. Tickets only - see `discountsApply` above.
                Only the code is sent; the saving beside it is the server's own
                arithmetic for this exact order. Enter applies the code rather
                than submitting the form - reaching the payment page by pressing
                Enter in a code field would be a nasty surprise. */}
            {isTicket && (
              <div>
                <label
                  htmlFor="checkout-discount"
                  className="mb-1.5 block font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                >
                  Discount code{' '}
                  <span className="font-normal normal-case tracking-normal text-gray-400">
                    (optional)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="checkout-discount"
                    name="discountCode"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={codeInput}
                    disabled={appliedCode !== null}
                    onChange={(event) => setCodeInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleApplyCode();
                      }
                    }}
                    aria-invalid={Boolean(codeError)}
                    aria-describedby="checkout-discount-hint"
                    className={[
                      fieldClass(Boolean(codeError)),
                      'uppercase placeholder:normal-case',
                      'disabled:bg-gray-50 disabled:text-gray-500'
                    ].join(' ')}
                    placeholder="Enter code"
                  />
                  {appliedCode !== null ? (
                    <button
                      type="button"
                      onClick={handleRemoveCode}
                      className="shrink-0 rounded-md border border-gray-300 px-3 font-['Outfit',sans-serif] text-[11px] font-bold uppercase tracking-wider text-gray-600 transition hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCode}
                      disabled={codeInput.trim() === '' || checkingCode}
                      className="shrink-0 rounded-md border border-[#4A0D12] px-4 font-['Outfit',sans-serif] text-[11px] font-bold uppercase tracking-wider text-[#4A0D12] transition hover:bg-[#4A0D12] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#4A0D12]"
                    >
                      Apply
                    </button>
                  )}
                </div>
                <p
                  id="checkout-discount-hint"
                  role="status"
                  className="mt-1 font-['Outfit',sans-serif] text-[11px] text-gray-500"
                >
                  {codeError ? (
                    <span className="text-red-600">{codeError}</span>
                  ) : checkingCode ? (
                    'Checking your code...'
                  ) : discountShown ? (
                    <span className="font-semibold text-green-700">
                      {quote.preview.code} applied &mdash; you save{' '}
                      {formatMoney(quote.preview.discountAmountCents)}.
                    </span>
                  ) : (
                    'Have a code? Apply it to see your saving before you pay.'
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Totals. Every figure comes from the server - the unit price from
              the catalogue, the saving from the discount quote - so what the
              buyer reads is what will be charged. */}
          <div className="mt-5 rounded-lg bg-[#fff8f0] px-4 py-3">
            {discountShown && (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Subtotal
                  </span>
                  <span className="font-['Outfit',sans-serif] text-sm font-semibold text-gray-700">
                    {formatMoney(subtotalCents)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between gap-3">
                  <span className="font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-green-700">
                    {quote.preview.label ?? 'Discount'}
                  </span>
                  <span className="font-['Outfit',sans-serif] text-sm font-semibold text-green-700">
                    &minus;{formatMoney(quote.preview.discountAmountCents)}
                  </span>
                </div>
                <div className="my-2.5 border-t border-[#e98314]/25" />
              </>
            )}
            <div className="flex items-baseline justify-between">
              <span className="font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Total
              </span>
              <span
                className="font-['Outfit',sans-serif] text-xl font-extrabold"
                style={{ color: GOLD }}
              >
                {formatMoney(payableCents)}
              </span>
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-['Outfit',sans-serif] text-[12px] text-red-700"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || checkingCode}
            className="mt-5 w-full rounded-md py-3 font-['Outfit',sans-serif] text-xs font-bold uppercase tracking-wider text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: submitting ? '#9ca3af' : GOLD }}
          >
            {submitting
              ? 'Taking you to secure payment...'
              : 'Continue to secure payment'}
          </button>

          <p className="mt-3 text-center font-['Outfit',sans-serif] text-[10px] leading-relaxed text-gray-500">
            Payment is completed on Square&rsquo;s secure checkout page. Your card
            details are never entered on, or stored by, this website.
          </p>
        </form>
      </div>
    </div>
  );
}

export default CheckoutModal;
