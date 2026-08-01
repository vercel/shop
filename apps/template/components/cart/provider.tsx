"use client";

import type { ComponentProps } from "react";

import { CartProvider as HydrogenCartProvider } from "@/lib/cart";

import { CartProvider } from "./context";

type CartInitialData = ComponentProps<typeof HydrogenCartProvider>["initialData"];

interface CartProviderWrapperProps {
  cartData: CartInitialData;
  children: React.ReactNode;
}

export function CartProviderWrapper({ cartData, children }: CartProviderWrapperProps) {
  return (
    <HydrogenCartProvider initialData={cartData}>
      <CartProvider>{children}</CartProvider>
    </HydrogenCartProvider>
  );
}
