"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { addToCartAction } from "@/lib/cart/action";
import { removeFromCartAction, updateCartQuantityAction } from "@/lib/cart/action";
import type { OptimisticProductInfo } from "@/lib/product";
import type { Cart, CartLine } from "@/lib/types";

const DEBOUNCE_MS = 400;

function createOptimisticCart(cart: Cart, lineId: string, newQuantity: number): Cart {
  const currentLine = cart.lines.find((l) => l.id === lineId);
  if (!currentLine) return cart;

  const quantityDiff = newQuantity - currentLine.quantity;
  const unitPrice = parseFloat(currentLine.cost.totalAmount.amount) / currentLine.quantity;

  return {
    ...cart,
    totalQuantity: cart.totalQuantity + quantityDiff,
    lines: cart.lines.map((line) =>
      line.id === lineId
        ? {
            ...line,
            quantity: newQuantity,
            cost: {
              ...line.cost,
              totalAmount: {
                ...line.cost.totalAmount,
                amount: (unitPrice * newQuantity).toString(),
              },
            },
          }
        : line,
    ),
  };
}

function createOptimisticCartWithoutItem(cart: Cart, lineId: string): Cart {
  const lineToRemove = cart.lines.find((l) => l.id === lineId);
  if (!lineToRemove) return cart;

  return {
    ...cart,
    totalQuantity: cart.totalQuantity - lineToRemove.quantity,
    lines: cart.lines.filter((line) => line.id !== lineId),
  };
}

function computeCartWithPending(
  cart: Cart | null,
  pendingQuantity: number,
  pendingLines: CartLine[],
): Cart | null {
  if (cart) {
    const mergedLines = [...cart.lines];
    for (const pl of pendingLines) {
      const existingIndex = mergedLines.findIndex((l) => l.merchandise.id === pl.merchandise.id);
      if (existingIndex >= 0) {
        const existing = mergedLines[existingIndex];
        const unitPrice = parseFloat(existing.cost.totalAmount.amount) / existing.quantity;
        const newQty = existing.quantity + pl.quantity;
        mergedLines[existingIndex] = {
          ...existing,
          quantity: newQty,
          cost: {
            ...existing.cost,
            totalAmount: {
              ...existing.cost.totalAmount,
              amount: (unitPrice * newQty).toString(),
            },
          },
        };
      } else {
        mergedLines.unshift(pl);
      }
    }
    return {
      ...cart,
      totalQuantity: cart.totalQuantity + pendingQuantity,
      lines: mergedLines,
    };
  }

  if (pendingQuantity > 0) {
    return {
      id: undefined,
      checkoutUrl: "",
      totalQuantity: pendingQuantity,
      note: null,
      cost: {
        subtotalAmount: { amount: "0", currencyCode: "USD" },
        totalAmount: { amount: "0", currencyCode: "USD" },
        totalTaxAmount: { amount: "0", currencyCode: "USD" },
      },
      lines: pendingLines,
      shippingCost: null,
    } as Cart;
  }

  return null;
}

function applyPendingLineOperations(
  cart: Cart | null,
  lineOps: Map<string, LineOperation>,
): Cart | null {
  if (!cart || lineOps.size === 0) return cart;

  let nextCart = cart;
  let changed = false;

  for (const [lineId, op] of lineOps) {
    const currentLine = nextCart.lines.find((line) => line.id === lineId);
    if (!currentLine) continue;
    if (currentLine.quantity === op.targetQuantity) continue;

    changed = true;
    const quantityDiff = op.targetQuantity - currentLine.quantity;
    const unitPrice = parseFloat(currentLine.cost.totalAmount.amount) / currentLine.quantity;

    nextCart = {
      ...nextCart,
      totalQuantity: nextCart.totalQuantity + quantityDiff,
      lines: nextCart.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              quantity: op.targetQuantity,
              cost: {
                ...line.cost,
                totalAmount: {
                  ...line.cost.totalAmount,
                  amount: (unitPrice * op.targetQuantity).toString(),
                },
              },
            }
          : line,
      ),
    };
  }

  return changed ? nextCart : cart;
}

type CartContextType = {
  cart: Cart | null;
  cartWithPending: Cart | null;
  setCart: (cart: Cart | null) => void;
  isOverlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  openOverlay: () => void;
  isAddingToCart: boolean;
  addToCartOptimistic: (
    variantId: string,
    quantity: number,
    productInfo?: OptimisticProductInfo,
  ) => Promise<boolean>;
  pendingQuantity: number;
  /** quantity=0 removes the item. */
  updateItemOptimistic: (lineId: string, quantity: number) => void;
  isUpdatingCart: boolean;
};

type LineOperation = {
  originalCart: Cart | null;
  targetQuantity: number;
  timer: ReturnType<typeof setTimeout> | null;
  hasFiredInitial: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

const serverFallbackCartContext: CartContextType = {
  cart: null,
  cartWithPending: null,
  setCart: () => {},
  isOverlayOpen: false,
  setOverlayOpen: () => {},
  openOverlay: () => {},
  isAddingToCart: false,
  addToCartOptimistic: async () => false,
  pendingQuantity: 0,
  updateItemOptimistic: () => {},
  isUpdatingCart: false,
};

export function CartProvider({
  children,
  initialCart,
}: {
  children: React.ReactNode;
  initialCart: Cart | null;
}) {
  const [cart, setCartInternal] = useState<Cart | null>(initialCart);
  const [, startTransition] = useTransition();

  const [isOverlayOpen, setOverlayOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(0);
  const [pendingLines, setPendingLines] = useState<CartLine[]>([]);

  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const inFlightCountRef = useRef(0);

  const openOverlay = useCallback(() => setOverlayOpen(true), []);

  const addToCartDebounceRef = useRef({
    pending: new Map<string, number>(),
    timer: null as ReturnType<typeof setTimeout> | null,
  });
  const addToCartResolversRef = useRef<Map<string, Array<(success: boolean) => void>>>(new Map());

  const isOverlayOpenRef = useRef(isOverlayOpen);
  isOverlayOpenRef.current = isOverlayOpen;

  // Pending line item ops use leading-edge debounce.
  const lineOpsRef = useRef<Map<string, LineOperation>>(new Map());
  // Per-line request versioning ignores stale responses that return out of order.
  const latestLineRequestIdRef = useRef<Map<string, number>>(new Map());

  const nextLineRequestId = (lineId: string) => {
    const nextId = (latestLineRequestIdRef.current.get(lineId) ?? 0) + 1;
    latestLineRequestIdRef.current.set(lineId, nextId);
    return nextId;
  };

  const displayCart = applyPendingLineOperations(cart, lineOpsRef.current);
  const cartWithPending = computeCartWithPending(displayCart, pendingQuantity, pendingLines);

  const buildOptimisticLine = (
    variantId: string,
    qty: number,
    info: OptimisticProductInfo,
  ): CartLine => ({
    id: `optimistic-${variantId}`,
    quantity: qty,
    cost: {
      totalAmount: {
        amount: (parseFloat(info.price.amount) * qty).toString(),
        currencyCode: info.price.currencyCode,
      },
    },
    merchandise: {
      id: variantId,
      title: info.variantTitle,
      image: info.image,
      price: info.price,
      selectedOptions: info.selectedOptions,
      product: {
        id: `optimistic-product-${variantId}`,
        handle: info.productHandle,
        title: info.productTitle,
        featuredImage: info.image,
      },
    },
  });

  const pendingProductInfoRef = useRef<Map<string, OptimisticProductInfo>>(new Map());

  /** Debounced — accumulates rapid clicks into a single request per variant. */
  const addToCartOptimistic = (
    variantId: string,
    quantity: number,
    productInfo?: OptimisticProductInfo,
  ) => {
    const debounce = addToCartDebounceRef.current;
    const requestPromise = new Promise<boolean>((resolve) => {
      const resolvers = addToCartResolversRef.current.get(variantId) ?? [];
      resolvers.push(resolve);
      addToCartResolversRef.current.set(variantId, resolvers);
    });

    if (productInfo) {
      pendingProductInfoRef.current.set(variantId, productInfo);
    }

    const current = debounce.pending.get(variantId) || 0;
    debounce.pending.set(variantId, current + quantity);

    const totalPending = Array.from(debounce.pending.values()).reduce((sum, q) => sum + q, 0);
    setPendingQuantity(totalPending);

    const nextPendingLines: CartLine[] = [];
    for (const [vid, qty] of debounce.pending) {
      const info = pendingProductInfoRef.current.get(vid);
      if (info) {
        nextPendingLines.push(buildOptimisticLine(vid, qty, info));
      }
    }
    setPendingLines(nextPendingLines);

    if (!isOverlayOpenRef.current) {
      setIsAddingToCart(true);
      setOverlayOpen(true);
    }

    if (debounce.timer !== null) {
      clearTimeout(debounce.timer);
    }

    debounce.timer = setTimeout(() => {
      debounce.timer = null;

      const items = new Map(debounce.pending);
      debounce.pending.clear();
      pendingProductInfoRef.current.clear();

      if (items.size === 0) return;

      const flushedResolvers = new Map<string, Array<(success: boolean) => void>>();
      for (const [vid] of items) {
        flushedResolvers.set(vid, addToCartResolversRef.current.get(vid) ?? []);
        addToCartResolversRef.current.delete(vid);
      }

      for (const [vid, qty] of items) {
        startTransition(async () => {
          let success = false;

          try {
            const result = await addToCartAction(vid, qty);
            success = result.success;

            if (result.success && result.cart) {
              setCartInternal(result.cart);
            }
          } catch (error) {
            console.error("Failed to add item to cart:", error);
          } finally {
            const resolvers = flushedResolvers.get(vid) ?? [];
            for (const resolve of resolvers) {
              resolve(success);
            }
          }

          // Only clear pending state if nothing was queued while in-flight.
          if (debounce.pending.size === 0) {
            setIsAddingToCart(false);
            setPendingQuantity(0);
            setPendingLines([]);
          }
        });
      }
    }, DEBOUNCE_MS);

    return requestPromise;
  };

  const trackInFlight = () => {
    inFlightCountRef.current++;
    setIsUpdatingCart(true);

    return () => {
      inFlightCountRef.current--;
      if (inFlightCountRef.current === 0) {
        setIsUpdatingCart(false);
      }
    };
  };

  const fireUpdateRequest = (lineId: string, quantity: number, originalCart: Cart | null) => {
    const requestId = nextLineRequestId(lineId);
    const endTracking = trackInFlight();

    startTransition(async () => {
      const result = await updateCartQuantityAction(lineId, quantity);
      // Ignore stale responses from older requests for this line.
      if (latestLineRequestIdRef.current.get(lineId) !== requestId) {
        endTracking();
        return;
      }

      const pending = lineOpsRef.current.get(lineId);

      if (result.success && result.cart) {
        // If the user changed quantity during the request, keep the optimistic
        // state — the debounce timer will fire the final request.
        if (!pending || pending.targetQuantity === quantity) {
          setCartInternal(result.cart);
          lineOpsRef.current.delete(lineId);
        }
      } else if (originalCart) {
        setCartInternal(originalCart);
        // If quantity changed again during the request, leave the pending
        // entry so the debounce timer will retry.
        if (!pending || pending.targetQuantity === quantity) {
          lineOpsRef.current.delete(lineId);
        }
      }

      endTracking();
    });
  };

  /**
   * quantity > 0: update with leading-edge debounce (first instant, rest debounced).
   * quantity === 0: remove immediately, no debounce.
   */
  const updateItemOptimistic = (lineId: string, quantity: number) => {
    if (quantity < 0 || quantity > 99 || !cart) return;

    if (quantity === 0) {
      const pending = lineOpsRef.current.get(lineId);
      if (pending?.timer) clearTimeout(pending.timer);

      const originalCart = pending?.originalCart ?? cart;
      lineOpsRef.current.delete(lineId);
      // Invalidate in-flight quantity-update responses for this line.
      nextLineRequestId(lineId);

      setCartInternal(createOptimisticCartWithoutItem(cart, lineId));

      const endTracking = trackInFlight();
      startTransition(async () => {
        const result = await removeFromCartAction(lineId);
        if (result.success && result.cart) {
          setCartInternal(result.cart);
        } else {
          setCartInternal(originalCart);
        }
        endTracking();
      });
      return;
    }

    let pending = lineOpsRef.current.get(lineId);

    if (!pending) {
      pending = {
        originalCart: cart,
        targetQuantity: quantity,
        timer: null,
        hasFiredInitial: false,
      };
      lineOpsRef.current.set(lineId, pending);
    }

    pending.targetQuantity = quantity;

    setCartInternal(createOptimisticCart(cart, lineId, quantity));

    if (pending.timer) clearTimeout(pending.timer);

    // Leading edge — first update fires immediately, the rest are debounced.
    if (!pending.hasFiredInitial) {
      pending.hasFiredInitial = true;
      fireUpdateRequest(lineId, quantity, pending.originalCart);
      return;
    }

    pending.timer = setTimeout(() => {
      const p = lineOpsRef.current.get(lineId);
      if (!p) return;
      fireUpdateRequest(lineId, p.targetQuantity, p.originalCart);
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    const debounce = addToCartDebounceRef.current;
    return () => {
      if (debounce.timer !== null) {
        clearTimeout(debounce.timer);
      }

      for (const [, pending] of lineOpsRef.current) {
        if (pending.timer !== null) {
          clearTimeout(pending.timer);
        }
      }
      latestLineRequestIdRef.current.clear();
    };
  }, []);

  // Drop pending ops for lines the revalidated cart no longer contains.
  useEffect(() => {
    const lineIds = new Set(cart?.lines.map((l) => l.id) ?? []);
    for (const [lineId, pending] of lineOpsRef.current) {
      if (!lineIds.has(lineId)) {
        if (pending.timer) clearTimeout(pending.timer);
        lineOpsRef.current.delete(lineId);
        latestLineRequestIdRef.current.delete(lineId);
      }
    }
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart: displayCart,
        cartWithPending,
        setCart: setCartInternal,
        isOverlayOpen,
        setOverlayOpen,
        openOverlay,
        isAddingToCart,
        addToCartOptimistic,
        pendingQuantity,
        updateItemOptimistic,
        isUpdatingCart,
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
