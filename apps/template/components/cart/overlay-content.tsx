"use client";

import { useCart } from "@shopify/hydrogen/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/use-checkout";
import type { Cart } from "@/lib/cart";

import { useCartDrawer } from "./context";
import { OverlayItem } from "./overlay-item";
import { OverlaySummary } from "./overlay-summary";
import { CartWarnings } from "./warnings";

function CheckoutButtonContent({
  isCheckingOut,
  isUpdatingCart,
}: {
  isCheckingOut: boolean;
  isUpdatingCart: boolean;
}) {
  if (isCheckingOut) {
    return (
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Redirecting...</span>
      </span>
    );
  }
  if (isUpdatingCart) {
    return (
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Updating cart...</span>
      </span>
    );
  }
  return <span>Go to Checkout</span>;
}

export function OverlayContent() {
  const router = useRouter();
  const displayCart = useCart<Cart, Cart>((state) => state.data);
  const isLoading = useCart((state) => state.loading);
  const {
    checkoutError,
    checkoutErrorId,
    handleCheckout,
    isCheckingOut,
    isCheckoutDisabled,
    isUpdatingCart,
  } = useCheckout();
  const { setOverlayOpen } = useCartDrawer();
  if (isLoading && displayCart.lines.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-2.5" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading cart…
      </div>
    );
  }
  if (displayCart.lines.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col gap-5 px-5">
        <CartWarnings />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h3 className="mb-6 text-2xl">Your cart is empty</h3>
          <Button
            onClick={() => {
              setOverlayOpen(false);
              router.push("/");
            }}
            className="h-12 px-8"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <CartWarnings />
        <ul className="space-y-5" aria-label="Cart items">
          {displayCart.lines.nodes.map((item) => (
            <OverlayItem key={item.id} item={item} />
          ))}
        </ul>
      </div>

      <footer className="px-5 py-5 space-y-5">
        <OverlaySummary cart={displayCart} />

        <div className="grid gap-2.5">
          <Button
            onClick={handleCheckout}
            className="w-full h-12 justify-center"
            disabled={isCheckoutDisabled}
            aria-busy={isCheckingOut || isUpdatingCart || undefined}
            aria-describedby={checkoutError ? checkoutErrorId : undefined}
            aria-label="Proceed to Checkout"
            type="button"
          >
            <CheckoutButtonContent isCheckingOut={isCheckingOut} isUpdatingCart={isUpdatingCart} />
          </Button>
          {checkoutError ? (
            <p className="text-xs text-destructive" id={checkoutErrorId} role="alert">
              {checkoutError}
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
