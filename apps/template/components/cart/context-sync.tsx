"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { Cart } from "@/lib/types";

import { useCart, useSeedCart } from "./context";

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
