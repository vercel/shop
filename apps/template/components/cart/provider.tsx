"use client";

import { CartProvider as HydrogenCartProvider } from "@/lib/cart";
import type { seedCartData } from "@/lib/cart/seed";

import { CartProvider } from "./context";

interface CartProviderWrapperProps {
  cartData: Promise<Awaited<ReturnType<typeof seedCartData>>>;
  children: React.ReactNode;
}

export function CartProviderWrapper({ cartData, children }: CartProviderWrapperProps) {
  return (
    <HydrogenCartProvider initialData={cartData}>
      <CartProvider>{children}</CartProvider>
    </HydrogenCartProvider>
  );
}
