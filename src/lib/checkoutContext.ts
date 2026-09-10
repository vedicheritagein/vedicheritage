import { createContext, useContext } from 'react';
import type { CatalogueProduct } from './payments';

export interface CheckoutContextValue {
  /**
   * Open the checkout form for a SKU.
   *
   * Always safe to call. If the price list has not loaded, or the SKU is not
   * one the server prices, the provider shows the phone/email dialog instead -
   * so a call to action never has to check readiness, and never does nothing.
   */
  openCheckout: (sku: string) => void;
  /**
   * Server-priced product, when the catalogue has loaded.
   *
   * Components render the amount from this in preference to their own hardcoded
   * copy, so the price on the page cannot drift from the price that is charged.
   */
  getProduct: (sku: string) => CatalogueProduct | undefined;
}

/** Defaults keep the app renderable outside the provider (e.g. in isolation). */
export const CheckoutContext = createContext<CheckoutContextValue>({
  openCheckout: () => undefined,
  getProduct: () => undefined
});

export function useCheckout(): CheckoutContextValue {
  return useContext(CheckoutContext);
}
