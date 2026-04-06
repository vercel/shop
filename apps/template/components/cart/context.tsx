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

import { addToCartAction } from "@/components/cart/actions";
import type { Cart, CartLine } from "@/lib/types";

import { removeFromCartAction, updateCartQuantityAction } from "./actions";
import { DEBOUNCE_MS } from "./constants";
import type { OptimisticProductInfo } from "./optimistic-info";

// Internal utility functions (moved from utils.ts)
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
    // Merge pending lines into existing cart lines
    const mergedLines = [...cart.lines];
    for (const pl of pendingLines) {
      const existingIndex = mergedLines.findIndex((l) => l.merchandise.id === pl.merchandise.id);
      if (existingIndex >= 0) {
        // Increment quantity on existing line
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
  // Update/remove line items - quantity=0 removes the item
  updateItemOptimistic: (lineId: string, quantity: number) => void;
  // True when any update/remove operation is in-flight
  isUpdatingCart: boolean;
};

// Type for tracking pending line operations
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

// DEBUG: CartProvider disabled to isolate hard-navigation issue on PDP.
// Renders children without cart context; useCart() returns no-op fallback below.
export function CartProvider({
  children,
}: {
  children: React.ReactNode;
  initialCart: Cart | null;
}) {
  return <>{children}</>;
}

export function useCart() {
  // DEBUG: Always return no-op fallback to isolate hard-navigation issue
  return serverFallbackCartContext;
}
