"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { prepareCheckoutAction } from "@/lib/cart/action";

import { useCart } from "./context";
import { CartMessages } from "./messages";
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
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{t("redirecting")}</span>
      </span>
    );
  }

  if (isUpdatingCart) {
    return (
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{t("updatingCart")}</span>
      </span>
    );
  }

  return <span>{t("completeCheckout")}</span>;
}

export function OverlayContent({ locale }: OverlayContentProps) {
  const router = useRouter();
  const { cart, cartWithPending, isUpdatingCart, lastError, setOverlayOpen } = useCart();
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

  const displayCart = cartWithPending;

  if (!displayCart || displayCart.lines.length === 0) {
    return (
      <div className="flex h-full flex-col px-5">
        {lastError ? (
          <div className="pt-5">
            <CartMessages />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h3 className="mb-6 text-2xl">{t("empty")}</h3>
          <Button
            onClick={() => {
              setOverlayOpen(false);
              router.push("/");
            }}
            className="h-12 px-8"
          >
            {t("continueShopping")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <CartMessages />
        <ul className="space-y-5" aria-label={t("cartItemsLabel")}>
          {displayCart.lines.map((item) => (
            <OverlayItem key={item.id} item={item} locale={locale} />
          ))}
        </ul>
      </div>

      <footer className="px-5 py-5 space-y-5">
        <OverlaySummary cart={displayCart} locale={locale} />

        <Button
          onClick={handleCheckout}
          className="w-full h-12 justify-center"
          disabled={isCheckingOut || isUpdatingCart}
          aria-label={t("proceedToCheckout")}
        >
          <CheckoutButtonContent isCheckingOut={isCheckingOut} isUpdatingCart={isUpdatingCart} />
        </Button>
      </footer>
    </div>
  );
}
