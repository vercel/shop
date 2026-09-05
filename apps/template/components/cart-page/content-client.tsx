"use client";

import type { ReactNode } from "react";

import { useCartRender } from "@/components/cart/context";

interface CartPageContentProps {
  children: ReactNode;
  empty: ReactNode;
}

export function CartPageContent({ children, empty }: CartPageContentProps) {
  const cart = useCartRender();
  return cart.totalQuantity === 0 ? empty : children;
}
