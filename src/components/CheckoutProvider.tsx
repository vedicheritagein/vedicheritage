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
  /** False until the price-list fetch has settled, one way or the other. */
  const [catalogueSettled, setCatalogueSettled] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    /**
     * Honour a click that landed while the list was still in flight.
     *
     * Done here rather than in an effect watching `products`, so the only
     * state updates happen in this callback - the click is resolved the moment
     * the answer exists, with nothing to keep in step.
     */
    const resolvePendingClick = (list: CatalogueProduct[] | null) => {
      const wanted = pendingSku.current;
      if (!wanted) return;
      pendingSku.current = null;
      setWaiting(false);
      if (list?.some((product) => product.sku === wanted)) {
        setActiveSku(wanted);
      } else {
        setShowContactFallback(true);
      }
    };

    fetchCatalogue()
      .then((catalogue) => {
        if (cancelled) return;
        // Only a non-empty list counts as loaded: `openCheckout` treats a
        // null list as "cannot open the form", so an empty catalogue routes to
        // the contact dialog rather than opening a form with nothing in it.
        const list = catalogue.products.length > 0 ? catalogue.products : null;
        setProducts(list);
        setCatalogueSettled(true);
        resolvePendingClick(list);
      })
      .catch(() => {
        // Deliberately silent: the fallback path is a working one, and a console
        // error on a public marketing page helps nobody.
        if (cancelled) return;
        setProducts(null);
        setCatalogueSettled(true);
        resolvePendingClick(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      // Clicked before the price list arrived. Now that a booking button sits
      // in the navbar, above the fold and clickable immediately, this is a
      // real race on a cold API - and answering it with "phone us instead"
      // for a payment page that is a moment away would be absurd. The fetch
      // opens the form as soon as it lands.
      if (!catalogueSettled) {
        pendingSku.current = sku;
        setWaiting(true);
        return;
      }
      setShowContactFallback(true);
    },
    [products, catalogueSettled]
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
