import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { CheckoutContext } from '../lib/checkoutContext';
import {
  clearReturnedOrderRef,
  fetchCatalogue,
  readReturnedOrderRef,
  type CatalogueProduct
} from '../lib/payments';
import { CheckoutModal } from './CheckoutModal';
import { ContactFallbackDialog } from './ContactFallbackDialog';
import { PaymentReturn } from './PaymentReturn';

/**
 * Owns everything payment-related: the price list, the checkout form and the
 * post-payment status view.
 *
 * The price list is fetched from the server rather than hardcoded, so the
 * amounts a buyer sees are always the amounts the server will charge. If that
 * fetch fails, `openCheckout` opens the phone/email dialog instead of the form
 * - an API outage should never leave a dead button on a fundraising page.
 */
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CatalogueProduct[] | null>(null);
  const [activeSku, setActiveSku] = useState<string | null>(null);
  /**
   * A SKU clicked before the price list arrived.
   *
   * Held in a ref because the fetch callback below reads it: as state it would
   * have to be a dependency of that effect, and a click would restart the
   * fetch. `waiting` mirrors it for rendering only.
   */
  const pendingSku = useRef<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  // Shown when a call to action cannot open the form because the price list is
  // not there. See openCheckout below.
  const [showContactFallback, setShowContactFallback] = useState(false);
  // The provider appends ?ref= on the way back. Read once at mount, before
  // anything else can rewrite the URL.
  const [returnedRef, setReturnedRef] = useState<string | null>(
    readReturnedOrderRef
  );

  /** True while a price-list request is in flight, so clicks queue rather than stack fetches. */
  const loading = useRef(false);
  /** Set on unmount, so a response that arrives late cannot update state. */
  const unmounted = useRef(false);

  /**
   * Honour a click that landed while the list was still in flight.
   *
   * The click is resolved the moment an answer exists, so there is no second
   * piece of state to keep in step with `products`.
   */
  const resolvePendingClick = useCallback((list: CatalogueProduct[] | null) => {
    const wanted = pendingSku.current;
    if (!wanted) return;
    pendingSku.current = null;
    setWaiting(false);
    if (list?.some((product) => product.sku === wanted)) {
      setActiveSku(wanted);
    } else {
      setShowContactFallback(true);
    }
  }, []);

  /**
   * Fetch the price list. Resolves true when a usable list was stored.
   *
   * `settle` says what a failure means for a click that is already waiting.
   * A retry is still to come when it is false, so the click stays queued and
   * can still open the form; only the final attempt gives up and sends the
   * visitor to the phone/email dialog.
   */
  const loadCatalogue = useCallback(
    async (settle: boolean): Promise<boolean> => {
      if (loading.current) return false;
      loading.current = true;

      try {
        const catalogue = await fetchCatalogue();
        if (unmounted.current) return false;
        // Only a non-empty list counts as loaded: `openCheckout` treats a
        // null list as "cannot open the form", so an empty catalogue routes to
        // the contact dialog rather than opening a form with nothing in it.
        const list = catalogue.products.length > 0 ? catalogue.products : null;
        setProducts(list);
        if (list || settle) resolvePendingClick(list);
        return list !== null;
      } catch {
        // Deliberately silent: the fallback path is a working one, and a console
        // error on a public marketing page helps nobody.
        if (unmounted.current) return false;
        setProducts(null);
        if (settle) resolvePendingClick(null);
        return false;
      } finally {
        loading.current = false;
      }
    },
    [resolvePendingClick]
  );

  useEffect(() => {
    unmounted.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    /**
     * Retry a failed price list before the visitor ever clicks.
     *
     * The API runs with no warm instance, so the first request after an idle
     * spell pays a cold start that can outlast the request timeout. That used
     * to be terminal: the list was marked settled, every "Book now" answered
     * with "phone us instead", and only a page reload cleared it - which is
     * precisely the moment a fundraising page cannot afford to look broken.
     * One retry covers the cold start, and `openCheckout` tries once more if
     * the visitor clicks before it has succeeded.
     */
    const retryDelayMs = 2_000;

    const attempt = async (isLast: boolean): Promise<void> => {
      const loaded = await loadCatalogue(isLast);
      if (loaded || isLast || unmounted.current) return;
      timer = setTimeout(() => void attempt(true), retryDelayMs);
    };

    void attempt(false);

    return () => {
      unmounted.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [loadCatalogue]);

  /**
   * Open the checkout form for a SKU, or the contact dialog if that is not
   * possible.
   *
   * The form cannot render without the server's price list, and the SKU has to
   * be one the server actually prices. When either is missing this used to set
   * `activeSku` anyway: the modal then found no product, rendered null, and the
   * button appeared to do nothing. Callers no longer have to test readiness -
   * every route out of a call to action now ends in something visible.
   */
  const openCheckout = useCallback(
    (sku: string) => {
      if (products?.some((product) => product.sku === sku)) {
        setActiveSku(sku);
        return;
      }

      // The list loaded and this SKU is not in it. A retry cannot change that,
      // so go straight to the phone/email dialog.
      if (products) {
        setShowContactFallback(true);
        return;
      }

      // No usable list yet - the first fetch is either still in flight or it
      // failed. Queue the click either way, and start a fresh attempt when
      // nothing is running, so a cold API costs the visitor a spinner instead
      // of a dead button that only a page reload fixes.
      pendingSku.current = sku;
      setWaiting(true);
      if (!loading.current) void loadCatalogue(true);
    },
    [products, loadCatalogue]
  );

  /** Give up on a queued click, so the wait is never a trap. */
  const cancelWaiting = useCallback(() => {
    pendingSku.current = null;
    setWaiting(false);
  }, []);

  const getProduct = useCallback(
    (sku: string) => products?.find((product) => product.sku === sku),
    [products]
  );

  const value = useMemo(
    () => ({ openCheckout, getProduct }),
    [openCheckout, getProduct]
  );

  const activeProduct =
    products?.find((product) => product.sku === activeSku) ?? null;

  // Every sponsorship tier, highest first, so the form can offer the choice
  // without refetching or hardcoding a second copy of the tier list.
  const sponsorshipOptions = useMemo(
    () =>
      (products ?? [])
        .filter((product) => product.kind === 'sponsorship')
        .sort((a, b) => b.unitAmountCents - a.unitAmountCents),
    [products]
  );

  const dismissReturn = useCallback(() => {
    // Drop the reference from the address bar so a refresh does not reopen the
    // status dialog, and a shared link does not carry someone's order.
    clearReturnedOrderRef();
    setReturnedRef(null);
  }, []);

  return (
    <CheckoutContext.Provider value={value}>
      {children}

      {/* Keyed by SKU: choosing a different product remounts the form with
          clean state, which is why CheckoutModal needs no reset effect. */}
      <CheckoutModal
        key={activeSku ?? 'none'}
        product={activeProduct}
        sponsorshipOptions={sponsorshipOptions}
        onClose={() => setActiveSku(null)}
      />

      {/* Shown only for the moment between an early click and the price list
          arriving, so the button visibly does something either way. */}
      {waiting && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={cancelWaiting}
        >
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-2xl"
          >
            <div
              className="h-5 w-5 animate-spin rounded-full border-[3px] border-gray-200"
              style={{ borderTopColor: '#e98314' }}
              aria-hidden="true"
            />
            <p className="font-['Outfit',sans-serif] text-[12px] text-gray-700">
              One moment &mdash; loading ticket prices...
            </p>
          </div>
        </div>
      )}

      <ContactFallbackDialog
        open={showContactFallback}
        onClose={() => setShowContactFallback(false)}
      />

      {returnedRef && (
        <PaymentReturn orderRef={returnedRef} onDismiss={dismissReturn} />
      )}
    </CheckoutContext.Provider>
  );
}

export default CheckoutProvider;
