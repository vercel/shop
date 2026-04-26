"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { prepareCheckoutAction } from "@/lib/cart/action";
import type { NamespaceMessages } from "@/lib/i18n";

import { useCart } from "./context";
import { OverlayItem } from "./overlay-item";
import { OverlaySummary } from "./overlay-summary";

interface OverlayContentProps {
  labels: NamespaceMessages<"cart">;
  locale: string;
}

function CheckoutButtonContent({
  isCheckingOut,
  isUpdatingCart,
  labels,
}: {
  isCheckingOut: boolean;
  isUpdatingCart: boolean;
  labels: NamespaceMessages<"cart">;
}) {
  if (isCheckingOut) {
    return (
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{labels.redirecting}</span>
      </span>
    );
  }

  if (isUpdatingCart) {
    return (
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{labels.updatingCart}</span>
      </span>
    );
  }

  return <span>{labels.completeCheckout}</span>;
}

export function OverlayContent({ labels, locale }: OverlayContentProps) {
  const router = useRouter();
  const { cart, cartWithPending, setOverlayOpen, isUpdatingCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Reset pending state when returning from checkout (bfcache / back navigation)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsCheckingOut(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleCheckout = async () => {
    if (!cart?.checkoutUrl && !displayCart?.checkoutUrl) return;
    setIsCheckingOut(true);

    const { checkoutUrl } = await prepareCheckoutAction();
    window.location.href = checkoutUrl || cart?.checkoutUrl || displayCart?.checkoutUrl || "";
  };

  // Use cartWithPending for display - it includes optimistic lines
  const displayCart = cartWithPending;

  if (!displayCart || displayCart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-5 text-center">
        <h3 className="text-2xl font-semibold tracking-tighter mb-6">{labels.empty}</h3>
        <Button
          onClick={() => {
            setOverlayOpen(false);
            router.push("/");
          }}
          className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90"
        >
          {labels.continueShopping}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Items List - Scrollable */}
      <ul className="flex-1 overflow-y-auto px-5 space-y-5" aria-label={labels.cartItemsLabel}>
        {displayCart.lines.map((item) => (
          <OverlayItem key={item.id} item={item} labels={labels} locale={locale} />
        ))}
      </ul>

      {/* Summary Section */}
      <footer className="px-5 py-5 space-y-5">
        <OverlaySummary cart={displayCart} labels={labels} locale={locale} />

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          className="w-full h-12 justify-center bg-foreground text-background hover:bg-foreground/90"
          disabled={isCheckingOut || isUpdatingCart}
          aria-label={labels.proceedToCheckout}
        >
          <CheckoutButtonContent
            isCheckingOut={isCheckingOut}
            isUpdatingCart={isUpdatingCart}
            labels={labels}
          />
        </Button>
      </footer>
    </div>
  );
}
