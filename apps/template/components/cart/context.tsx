"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { toDomainCart } from "@/lib/cart";
import { addToCart, HydrogenCartProvider, useHydrogenCart } from "@/lib/cart/client";
import type { OptimisticProductInfo } from "@/lib/product";
import type { Cart, CartWarning } from "@/lib/types";

export type CartMutationError = "add" | "remove" | "update";

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
  setCart: (cart: Cart | null) => void;
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
  setCart: () => {},
  setOverlayOpen: () => {},
  setWarnings: () => {},
};

function toLegacyWarnings(group: { warnings: { code: string; message: string }[] }): CartWarning[] {
  return group.warnings.map((w) => ({ code: w.code, message: w.message, target: "" }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOverlayOpen, setOverlayOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [lastError, setLastError] = useState<CartMutationError | null>(null);
  const [localWarnings, setLocalWarnings] = useState<CartWarning[]>([]);
  const clearError = useCallback(() => setLastError(null), []);
  const clearWarnings = useCallback(() => setLocalWarnings([]), []);

  const cartState = useHydrogenCart((state) => state);
  const cartWithPending = toDomainCart(cartState.data);
  const isCostSettling = Boolean(cartState.pending.cost || cartState.revalidating);
  const settledCartRef = useRef(cartWithPending);
  if (!isCostSettling) settledCartRef.current = cartWithPending;
  const cart = settledCartRef.current;
  const isUpdatingCart = Boolean(
    cartState.pending.attributes ||
    cartState.pending.cost ||
    cartState.pending.discountCodes.size > 0 ||
    cartState.pending.lines.size > 0 ||
    cartState.pending.note ||
    cartState.revalidating,
  );

  const isOverlayOpenRef = useRef(isOverlayOpen);
  useEffect(() => {
    isOverlayOpenRef.current = isOverlayOpen;
  }, [isOverlayOpen]);

  const openOverlay = useCallback(() => setOverlayOpen(true), []);

  useEffect(() => {
    if (cartState.pending.lines.size === 0) setIsAddingToCart(false);
  }, [cartState.pending.lines]);

  const addToCartOptimistic = useCallback(
    (variantId: string, quantity: number, productInfo?: OptimisticProductInfo) => {
      setLastError(null);
      if (!isOverlayOpenRef.current) {
        setIsAddingToCart(true);
        setOverlayOpen(true);
      }
      addToCart(variantId, quantity, productInfo);
    },
    [],
  );

  useEffect(() => {
    const hasFailure =
      cartState.errors.network.length > 0 ||
      cartState.errors.lines.size > 0 ||
      cartState.errors.cart.userErrors.length > 0;
    if (hasFailure) {
      setLastError("update");
      setLocalWarnings(toLegacyWarnings(cartState.errors.cart));
    }
  }, [cartState.errors]);

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
        lastWarnings: localWarnings,
        openOverlay,
        pendingQuantity: cartState.pending.lines.size,
        setCart: () => {},
        setOverlayOpen,
        setWarnings: setLocalWarnings,
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
