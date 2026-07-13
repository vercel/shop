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
import type { Cart, CartLine, CartWarning } from "@/lib/types";

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
      },
      lines: pendingLines,
      shippingCost: null,
      discountCodes: [],
      discountAllocations: [],
      appliedGiftCards: [],
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

type LineOperation = {
  originalCart: Cart | null;
  targetQuantity: number;
  timer: ReturnType<typeof setTimeout> | null;
  hasFiredInitial: boolean;
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
  const [lastError, setLastError] = useState<CartMutationError | null>(null);
  const [lastWarnings, setLastWarnings] = useState<CartWarning[]>([]);
  const clearError = useCallback(() => setLastError(null), []);
  const clearWarnings = useCallback(() => setLastWarnings([]), []);

  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const inFlightCountRef = useRef(0);

  const openOverlay = useCallback(() => setOverlayOpen(true), []);

  const addToCartDebounceRef = useRef({
    pending: new Map<string, number>(),
    timer: null as ReturnType<typeof setTimeout> | null,
  });
  const isOverlayOpenRef = useRef(isOverlayOpen);
  isOverlayOpenRef.current = isOverlayOpen;

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
    canRemove: true,
    canUpdateQuantity: true,
    components: [],
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
    discountAllocations: [],
  });

  const pendingProductInfoRef = useRef<Map<string, OptimisticProductInfo>>(new Map());

  const addToCartOptimistic = (
    variantId: string,
    quantity: number,
    productInfo?: OptimisticProductInfo,
  ) => {
    setLastError(null);
    const debounce = addToCartDebounceRef.current;

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

      for (const [vid, qty] of items) {
        startTransition(async () => {
          try {
            const result = await addToCartAction(vid, qty);

            if (result.success && result.cart) {
              setCartInternal(result.cart);
              setLastWarnings(result.warnings ?? []);
            } else {
              setLastError("add");
            }
          } catch (error) {
            console.error("Failed to add item to cart:", error);
            setLastError("add");
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
      try {
        const result = await updateCartQuantityAction(lineId, quantity);
        if (latestLineRequestIdRef.current.get(lineId) !== requestId) return;

        const pending = lineOpsRef.current.get(lineId);

        if (result.success && result.cart) {
          // Preserve newer optimistic input; its debounce will issue the final request.
          if (!pending || pending.targetQuantity === quantity) {
            setCartInternal(result.cart);
            setLastWarnings(result.warnings ?? []);
            lineOpsRef.current.delete(lineId);
          }
        } else {
          if (originalCart) setCartInternal(originalCart);
          setLastError("update");
          // Preserve newer pending input so the debounce can retry it.
          if (!pending || pending.targetQuantity === quantity) {
            lineOpsRef.current.delete(lineId);
          }
        }
      } catch (error) {
        console.error("Failed to update cart quantity:", error);
        if (latestLineRequestIdRef.current.get(lineId) === requestId) {
          const pending = lineOpsRef.current.get(lineId);
          if (originalCart) setCartInternal(originalCart);
          setLastError("update");
          if (!pending || pending.targetQuantity === quantity) {
            lineOpsRef.current.delete(lineId);
          }
        }
      } finally {
        endTracking();
      }
    });
  };

  // quantity > 0: leading-edge debounce. quantity === 0: remove immediately.
  const updateItemOptimistic = (lineId: string, quantity: number) => {
    if (quantity < 0 || quantity > 99 || !cart) return;

    setLastError(null);

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
        try {
          const result = await removeFromCartAction(lineId);
          if (result.success && result.cart) {
            setCartInternal(result.cart);
            setLastWarnings(result.warnings ?? []);
          } else {
            setCartInternal(originalCart);
            setLastError("remove");
          }
        } catch (error) {
          console.error("Failed to remove cart item:", error);
          setCartInternal(originalCart);
          setLastError("remove");
        } finally {
          endTracking();
        }
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

      // oxlint-disable-next-line react-hooks/exhaustive-deps -- clear timers held at unmount, not at effect setup
      for (const [, pending] of lineOpsRef.current) {
        if (pending.timer !== null) {
          clearTimeout(pending.timer);
        }
      }
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- clear the latest request-id map at unmount
      latestLineRequestIdRef.current.clear();
    };
  }, []);

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
        addToCartOptimistic,
        cart: displayCart,
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
        setCart: setCartInternal,
        setOverlayOpen,
        setWarnings: setLastWarnings,
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

// Idempotent so every server boundary may seed the root provider.
export function useSeedCart(initialCart: Cart | null) {
  const { cart, setCart } = useCart();
  useEffect(() => {
    if (cart === null && initialCart !== null) {
      setCart(initialCart);
    }
  }, [cart, initialCart, setCart]);
}
