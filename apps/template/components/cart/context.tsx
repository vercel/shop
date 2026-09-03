"use client";

import type { CartErrorState } from "@shopify/hydrogen";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { toDomainCart } from "@/lib/cart";
import { addToCart, HydrogenCartProvider, useHydrogenCart } from "@/lib/cart/client";
import type { OptimisticProductInfo } from "@/lib/product";
import type { Cart, CartWarning } from "@/lib/types";

type CartMutationError = "add" | "remove" | "update";

type CartContextType = {
  addToCartOptimistic: (
    variantId: string,
    quantity: number,
    productInfo?: OptimisticProductInfo,
  ) => void;
  cart: Cart | null;
  cartWithPending: Cart | null;
  clearError: () => void;
  clearWarnings: () => void;
  isAddingToCart: boolean;
  isOverlayOpen: boolean;
  isUpdatingCart: boolean;
  lastError: CartMutationError | null;
  lastWarnings: CartWarning[];
  openOverlay: () => void;
  pendingQuantity: number;
  setOverlayOpen: (open: boolean) => void;
  setWarnings: (warnings: CartWarning[]) => void;
};

const CartContext = createContext<CartContextType | null>(null);

const serverFallbackCartContext: CartContextType = {
  addToCartOptimistic: () => {},
  cart: null,
  cartWithPending: null,
  clearError: () => {},
  clearWarnings: () => {},
  isAddingToCart: false,
  isOverlayOpen: false,
  isUpdatingCart: false,
  lastError: null,
  lastWarnings: [],
  openOverlay: () => {},
  pendingQuantity: 0,
  setOverlayOpen: () => {},
  setWarnings: () => {},
};

function toLegacyWarnings(group: { warnings: { code: string; message: string }[] }): CartWarning[] {
  return group.warnings.map((w) => ({ code: w.code, message: w.message, target: "" }));
}

function hasCartFailure(errors: CartErrorState): boolean {
  return errors.network.length > 0 || errors.lines.size > 0 || errors.cart.userErrors.length > 0;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOverlayOpen, setOverlayOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [dismissedError, setDismissedError] = useState<CartErrorState | null>(null);
  const [warningsOverride, setWarningsOverride] = useState<{
    errors: CartErrorState;
    warnings: CartWarning[];
  } | null>(null);

  const cartState = useHydrogenCart((state) => state);
  const cartWithPending = toDomainCart(cartState.data);
  const isCostSettling = Boolean(cartState.pending.cost || cartState.revalidating);
  // Hold the last settled totals while Shopify recomputes cost so the drawer doesn't flash stale-to-new.
  const [settledCart, setSettledCart] = useState(cartWithPending);
  if (!isCostSettling && settledCart !== cartWithPending) setSettledCart(cartWithPending);
  const cart = isCostSettling ? settledCart : cartWithPending;

  const isUpdatingCart = Boolean(
    cartState.pending.attributes ||
    cartState.pending.cost ||
    cartState.pending.discountCodes.size > 0 ||
    cartState.pending.lines.size > 0 ||
    cartState.pending.note ||
    cartState.revalidating,
  );

  // The store registers the optimistic line one tick after the click; only clear once pending has actually drained.
  const pendingQuantity = cartState.pending.lines.size;
  const [sawPending, setSawPending] = useState(false);
  if (isAddingToCart && pendingQuantity > 0 && !sawPending) setSawPending(true);
  if (isAddingToCart && sawPending && pendingQuantity === 0) {
    setIsAddingToCart(false);
    setSawPending(false);
  }

  const { errors } = cartState;
  const isErrorVisible = hasCartFailure(errors) && dismissedError !== errors;
  const lastError: CartMutationError | null = isErrorVisible ? "update" : null;
  const lastWarnings =
    warningsOverride?.errors === errors
      ? warningsOverride.warnings
      : isErrorVisible
        ? toLegacyWarnings(errors.cart)
        : [];

  const clearError = useCallback(() => setDismissedError(errors), [errors]);
  const setWarnings = useCallback(
    (warnings: CartWarning[]) => setWarningsOverride({ errors, warnings }),
    [errors],
  );
  const clearWarnings = useCallback(() => setWarnings([]), [setWarnings]);
  const openOverlay = useCallback(() => setOverlayOpen(true), []);

  const addToCartOptimistic = useCallback(
    (variantId: string, quantity: number, productInfo?: OptimisticProductInfo) => {
      setDismissedError(errors);
      if (!isOverlayOpen) {
        setIsAddingToCart(true);
        setOverlayOpen(true);
      }
      addToCart(variantId, quantity, productInfo);
    },
    [errors, isOverlayOpen],
  );

  return (
    <CartContext.Provider
      value={{
        addToCartOptimistic,
        cart,
        cartWithPending,
        clearError,
        clearWarnings,
        isAddingToCart,
        isOverlayOpen,
        isUpdatingCart,
        lastError,
        lastWarnings,
        openOverlay,
        pendingQuantity,
        setOverlayOpen,
        setWarnings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    if (typeof window === "undefined") {
      return serverFallbackCartContext;
    }
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

type CartInitialData = ComponentProps<typeof HydrogenCartProvider>["initialData"];

interface CartProviderWrapperProps {
  cartData: CartInitialData;
  children: ReactNode;
}

export function CartProviderWrapper({ cartData, children }: CartProviderWrapperProps) {
  return (
    <HydrogenCartProvider initialData={cartData}>
      <CartProvider>{children}</CartProvider>
    </HydrogenCartProvider>
  );
}

const CartRenderContext = createContext<Cart | null>(null);

interface CartContextSyncProps {
  cart: Cart | null;
  children: ReactNode;
}

export function CartContextSync({ cart, children }: CartContextSyncProps) {
  const { cartWithPending } = useCart();

  // Fall back to the server-fetched cart until the provider is seeded — avoids a hydration flash.
  return (
    <CartRenderContext.Provider value={cartWithPending ?? cart}>
      {children}
    </CartRenderContext.Provider>
  );
}

export function useCartRender() {
  return useContext(CartRenderContext);
}
