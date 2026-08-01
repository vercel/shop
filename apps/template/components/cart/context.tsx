"use client";

import type { CartState } from "@shopify/hydrogen";
import {
  CartProvider as HydrogenCartProvider,
  useCart as useHydrogenCart,
} from "@shopify/hydrogen/react";
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

import { addToCart, updateCartLine } from "@/lib/cart/client";
import type { OptimisticProductInfo } from "@/lib/product";
import type { Cart, CartLine, CartWarning } from "@/lib/types";

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
  /** quantity=0 removes the item. */
  updateItemOptimistic: (lineId: string, quantity: number) => void;
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
  updateItemOptimistic: () => {},
};

type LegacyMerchandise = {
  id?: string;
  image?: {
    altText?: string | null;
    height?: number | null;
    url: string;
    width?: number | null;
  } | null;
  price?: { amount: string; currencyCode: string } | null;
  product?: { handle?: string; id?: string; title?: string };
  selectedOptions?: { name: string; value: string }[];
  title?: string;
};

type LegacyLine = {
  cost: { totalAmount: { amount: string; currencyCode: string } };
  id: string;
  instructions?: { canRemove: boolean; canUpdateQuantity: boolean } | null;
  lineComponents?: LegacyLine[] | null;
  merchandise?: LegacyMerchandise | null;
  quantity: number;
};

function toLegacyCart(data: CartState["data"]): Cart | null {
  if (data.id === null && data.totalQuantity === 0 && data.lines.nodes.length === 0) return null;
  return {
    appliedGiftCards: [],
    checkoutUrl: data.checkoutUrl ?? "",
    cost: {
      subtotalAmount: data.cost.subtotalAmount,
      totalAmount: data.cost.totalAmount,
    },
    discountAllocations: [],
    discountCodes: (data.discountCodes ?? []).map((d: { applicable: boolean; code: string }) => ({
      applicable: d.applicable,
      code: d.code,
    })),
    id: data.id ?? undefined,
    lines: data.lines.nodes.map((l) => toLegacyLine(l as unknown as LegacyLine)),
    note: data.note ?? null,
    shippingCost: null,
    totalQuantity: data.totalQuantity,
  };
}

function toLegacyImage(image: LegacyMerchandise["image"]) {
  return {
    altText: image?.altText ?? "",
    height: image?.height ?? 0,
    url: image?.url ?? "",
    width: image?.width ?? 0,
  };
}

function toLegacyLine(line: LegacyLine): CartLine {
  const merchandise = line.merchandise;
  const image = merchandise?.image;
  return {
    canRemove: line.instructions?.canRemove ?? true,
    canUpdateQuantity: line.instructions?.canUpdateQuantity ?? true,
    components: (line.lineComponents ?? []).map((c) => toLegacyLine(c)),
    cost: {
      totalAmount: line.cost.totalAmount,
    },
    discountAllocations: [],
    id: line.id,
    merchandise: {
      id: merchandise?.id ?? "",
      ...(image ? { image: toLegacyImage(image) } : {}),
      ...(merchandise?.price ? { price: merchandise.price } : {}),
      product: {
        featuredImage: toLegacyImage(image),
        handle: merchandise?.product?.handle ?? "",
        id: merchandise?.product?.id ?? "",
        title: merchandise?.product?.title ?? "",
      },
      selectedOptions: merchandise?.selectedOptions ?? [],
      title: merchandise?.title ?? "",
    },
    quantity: line.quantity,
  };
}

function findLine(lines: CartLine[], id: string): CartLine | undefined {
  for (const line of lines) {
    if (line.id === id) return line;
    const inChildren = findLine(line.components, id);
    if (inChildren) return inChildren;
  }
  return undefined;
}

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
  const cart = toLegacyCart(cartState.data);
  const isUpdatingCart =
    cartState.pending.lines.size > 0 ||
    cartState.pending.discountCodes.size > 0 ||
    cartState.pending.note;

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

  const updateItemOptimistic = useCallback(
    (lineId: string, quantity: number) => {
      if (quantity < 0 || quantity > 99) return;
      const line = findLine(cart?.lines ?? [], lineId);
      if (!line) return;
      updateCartLine(lineId, quantity);
    },
    [cart?.lines],
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
        cartWithPending: cart,
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
        updateItemOptimistic,
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

export function useSeedCart(_initialCart: Cart | null) {}

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
  const { cart: currentCart } = useCart();
  useSeedCart(cart);

  // Fall back to the server-fetched cart until the provider is seeded — avoids a hydration flash.
  return (
    <CartRenderContext.Provider value={currentCart ?? cart}>{children}</CartRenderContext.Provider>
  );
}

export function useCartRender() {
  return useContext(CartRenderContext);
}
