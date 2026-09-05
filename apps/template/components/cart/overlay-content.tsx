"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { useCart } from "./context";
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
  const { cart, cartWithPending, isUpdatingCart, setOverlayOpen } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // Reset pending state when returning from checkout (bfcache / back navigation)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsCheckingOut(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
  const displayCart = cartWithPending;
  const handleCheckout = () => {
    if (!displayCart?.checkoutUrl) return;
    setIsCheckingOut(true);
    window.location.href = displayCart.checkoutUrl;
  };
  if (!displayCart || displayCart.lines.length === 0) {
    return (
      <div className="flex h-full flex-col px-5">
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
          {displayCart.lines.map((item) => (
            <OverlayItem key={item.id} item={item} />
          ))}
        </ul>
      </div>

      <footer className="px-5 py-5 space-y-5">
        <OverlaySummary cart={cart ?? displayCart} />

        <Button
          onClick={handleCheckout}
          className="w-full h-12 justify-center"
          disabled={isCheckingOut || isUpdatingCart}
          aria-label="Proceed to Checkout"
        >
          <CheckoutButtonContent isCheckingOut={isCheckingOut} isUpdatingCart={isUpdatingCart} />
        </Button>
      </footer>
    </div>
  );
}
