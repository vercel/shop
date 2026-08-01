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

import {
  addToCart,
  DISCOUNT_RESOLVED_EVENT,
  type DiscountResolution,
  updateCartLine,
} from "@/lib/cart/client";
import type { OptimisticProductInfo } from "@/lib/product";
import type { Cart, CartLine, CartWarning } from "@/lib/types";

export type CartMutationError = "add" | "remove" | "update";

// Matches Hydrogen's OPTIMISTIC_LINE_ID_PREFIX; server cart returns new lines first, so optimistic lines sort to the front.
const OPTIMISTIC_LINE_ID_PREFIX = "optimistic:";

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
  cost: {
    amountPerQuantity?: { amount: string; currencyCode: string } | null;
    totalAmount: { amount: string; currencyCode: string };
  };
  id: string;
  instructions?: { canRemove: boolean; canUpdateQuantity: boolean } | null;
  lineComponents?: LegacyLine[] | null;
  merchandise?: LegacyMerchandise | null;
  quantity: number;
};

// Line costs from a just-resolved discount mutation, keyed by line id. The Hydrogen
// store refetch can lag behind the mutation response, so these keep prices truthful
// in the meantime.
type LineCostOverride = {
  catalogPrice: { amount: string; currencyCode: string } | null;
  originalAmount: { amount: string; currencyCode: string };
  quantity: number;
  totalAmount: { amount: string; currencyCode: string };
};

function toLegacyCart(
  data: CartState["data"],
  discountOverride?: { applicable: boolean; code: string }[] | null,
  lineOverrides?: Map<string, LineCostOverride> | null,
): Cart | null {
  if (data.id === null && data.totalQuantity === 0 && data.lines.nodes.length === 0) return null;
  return {
    appliedGiftCards: [],
    checkoutUrl: data.checkoutUrl ?? "",
    cost: {
      subtotalAmount: data.cost.subtotalAmount,
      totalAmount: data.cost.totalAmount,
    },
    discountAllocations: [],
    discountCodes: (discountOverride ?? data.discountCodes ?? []).map(
      (d: { applicable: boolean; code: string }) => ({
        applicable: d.applicable,
        code: d.code,
      }),
    ),
    id: data.id ?? undefined,
    lines: data.lines.nodes
      .map((l) => {
        const legacy = l as unknown as LegacyLine;
        return toLegacyLine(legacy, lineOverrides?.get(legacy.id) ?? undefined);
      })
      .sort(
        (a, b) =>
          Number(b.id?.startsWith(OPTIMISTIC_LINE_ID_PREFIX) ?? false) -
          Number(a.id?.startsWith(OPTIMISTIC_LINE_ID_PREFIX) ?? false),
      ),
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

function toLegacyLine(line: LegacyLine, override?: LineCostOverride): CartLine {
  const merchandise = line.merchandise;
  const image = merchandise?.image;
  const totalAmount = override?.totalAmount ?? line.cost.totalAmount;
  const quantity = override?.quantity ?? line.quantity;
  // The catalog unit price is the true pre-discount price. Fall back to amountPerQuantity
  // (pre-discount for order/item discounts, already-reduced for line-price discounts).
  const catalogPrice = override?.catalogPrice ?? merchandise?.price;
  const catalogUnit = catalogPrice ? Number.parseFloat(catalogPrice.amount) : null;
  const perQuantityUnit =
    (override?.originalAmount ?? line.cost.amountPerQuantity) != null
      ? Number.parseFloat((override?.originalAmount ?? line.cost.amountPerQuantity)!.amount)
      : null;
  const originalUnit =
    catalogUnit != null && (perQuantityUnit == null || catalogUnit > perQuantityUnit)
      ? catalogUnit
      : perQuantityUnit;
  const originalTotal = originalUnit != null ? originalUnit * quantity : null;
  const discountedPerUnit =
    originalTotal != null &&
    originalTotal > 0 &&
    Number.parseFloat(totalAmount.amount) < originalTotal
      ? {
          amount: (Number.parseFloat(totalAmount.amount) / quantity).toFixed(2),
          currencyCode: totalAmount.currencyCode,
        }
      : undefined;
  return {
    canRemove: line.instructions?.canRemove ?? true,
    canUpdateQuantity: line.instructions?.canUpdateQuantity ?? true,
    components: (line.lineComponents ?? []).map((c) => toLegacyLine(c)),
    cost: {
      totalAmount,
    },
    discountAllocations: discountedPerUnit
      ? [{ discountedAmount: totalAmount, kind: "custom" as const, title: "Discount" }]
      : [],
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
  const [appliedDiscountCodes, setAppliedDiscountCodes] = useState<
    { applicable: boolean; code: string }[] | null
  >(null);
  const [lineCostOverrides, setLineCostOverrides] = useState<Map<string, LineCostOverride> | null>(
    null,
  );
  const cart = toLegacyCart(cartState.data, appliedDiscountCodes, lineCostOverrides);
  const isUpdatingCart = cartState.pending.lines.size > 0 || cartState.pending.note;

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

  // Discount codes bypass the Hydrogen event flow (see lib/cart/client) and land here resolved.
  useEffect(() => {
    function onResolved(event: Event) {
      const detail = (event as CustomEvent<DiscountResolution>).detail;
      setAppliedDiscountCodes(detail.cart?.discountCodes ?? null);
      setLineCostOverrides(
        detail.cart?.lines?.length ? new Map(detail.cart.lines.map((l) => [l.id, l])) : null,
      );
    }
    document.addEventListener(DISCOUNT_RESOLVED_EVENT, onResolved);
    return () => document.removeEventListener(DISCOUNT_RESOLVED_EVENT, onResolved);
  }, []);

  // Clear the local overrides once the Hydrogen store catches up (e.g. after a refetch).
  useEffect(() => {
    if (!appliedDiscountCodes) return;
    const storeCodes = cartState.data.discountCodes ?? [];
    if (
      storeCodes.length === appliedDiscountCodes.length &&
      storeCodes.every((c, i) => c.code === appliedDiscountCodes[i]?.code)
    ) {
      setAppliedDiscountCodes(null);
      setLineCostOverrides(null);
    }
  }, [cartState.data.discountCodes, appliedDiscountCodes]);

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
