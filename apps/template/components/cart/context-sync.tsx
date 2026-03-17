"use client";

import { createContext, type ReactNode, useContext, useEffect } from "react";

import type { Cart } from "@/lib/types";

import { useCart } from "./context";

const CartRenderContext = createContext<Cart | null>(null);

interface CartContextSyncProps {
  cart: Cart | null;
  children: ReactNode;
}

export function CartContextSync({ cart, children }: CartContextSyncProps) {
  const { cart: currentCart, setCart } = useCart();
  useEffect(() => {
    if (currentCart === null && cart !== null) {
      setCart(cart);
    }
  }, [currentCart, cart, setCart]);

  return (
    <CartRenderContext.Provider value={currentCart ?? cart}>{children}</CartRenderContext.Provider>
  );
}

export function useCartRender() {
  return useContext(CartRenderContext);
}
