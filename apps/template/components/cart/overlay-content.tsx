"use client";

import { ArrowRightIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { prepareCheckoutAction } from "@/lib/cart/action";

import { useCart } from "./context";
import { OverlayItem } from "./overlay-item";
import { OverlaySummary } from "./overlay-summary";

interface OverlayContentProps {
  locale: string;
}

function CheckoutButtonContent({
  isCheckingOut,
  isUpdatingCart,
}: {
  isCheckingOut: boolean;
  isUpdatingCart: boolean;
}) {
  const t = useTranslations("cart");
  if (isCheckingOut) {
    return (
      <>
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{t("redirecting")}</span>
        </span>
        <span className="size-8" />
      </>
    );
  }

  if (isUpdatingCart) {
    return (
      <>
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{t("updatingCart")}</span>
        </span>
        <span className="size-8" />
      </>
    );
  }

  return (
    <>
      <span>{t("completeCheckout")}</span>
      <span className="flex items-center justify-center size-8 rounded-full bg-background text-primary">
        <ArrowRightIcon className="size-4" />
      </span>
    </>
  );
}

export function OverlayContent({ locale }: OverlayContentProps) {
  const router = useRouter();
  const { cart, cartWithPending, setOverlayOpen, isUpdatingCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const t = useTranslations("cart");

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
      <div className="flex flex-col items-center justify-center h-full py-10 px-5 text-center">
        <div className="rounded-full bg-muted p-5 mb-4">
          <svg
            className="size-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>{t("shoppingBagTitle")}</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{t("empty")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("startAdding")}</p>
        <Button
          onClick={() => {
            setOverlayOpen(false);
            router.push("/");
          }}
        >
          {t("continueShopping")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Items List - Scrollable */}
      <ul className="flex-1 overflow-y-auto px-5 space-y-5" aria-label={t("cartItemsLabel")}>
        {displayCart.lines.map((item) => (
          <OverlayItem key={item.id} item={item} locale={locale} />
        ))}
      </ul>

      {/* Summary Section */}
      <footer className="px-5 py-5 space-y-5">
        <OverlaySummary cart={displayCart} locale={locale} />

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          className="w-full h-12 text-base font-semibold justify-between pl-5 pr-2"
          size="lg"
          disabled={isCheckingOut || isUpdatingCart}
          aria-label={t("proceedToCheckout")}
        >
          <CheckoutButtonContent isCheckingOut={isCheckingOut} isUpdatingCart={isUpdatingCart} />
        </Button>

        {/* View Full Cart Link */}
        <Link
          href="/cart"
          onClick={() => setOverlayOpen(false)}
          className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          {t("viewFullCart")}
        </Link>
      </footer>
    </div>
  );
}
