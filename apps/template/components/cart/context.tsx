"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { CartProvider } from "@/lib/cart/client";

interface CartDrawerContextValue {
  isOverlayOpen: boolean;
  openOverlay: () => void;
  setOverlayOpen: (open: boolean) => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOverlayOpen, setOverlayOpen] = useState(false);
  const openOverlay = useCallback(() => setOverlayOpen(true), []);

  return (
    <CartDrawerContext.Provider value={{ isOverlayOpen, openOverlay, setOverlayOpen }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (!context) throw new Error("useCartDrawer must be used within CartDrawerProvider");
  return context;
}

interface CartProviderWrapperProps {
  cartData: ComponentProps<typeof CartProvider>["initialData"];
  children: ReactNode;
}

export function CartProviderWrapper({ cartData, children }: CartProviderWrapperProps) {
  return (
    <CartProvider initialData={cartData}>
      <CartDrawerProvider>{children}</CartDrawerProvider>
    </CartProvider>
  );
}
