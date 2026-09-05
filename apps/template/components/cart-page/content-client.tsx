"use client";

import type { ReactNode } from "react";

import { useSuspenseCart } from "@/lib/cart/client";

interface CartPageContentProps {
  children: ReactNode;
  empty: ReactNode;
}

export function CartPageContent({ children, empty }: CartPageContentProps) {
  const quantity = useSuspenseCart((state) => state.data.totalQuantity);
  return quantity === 0 ? empty : children;
}
