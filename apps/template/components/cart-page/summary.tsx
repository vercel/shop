"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/context";
import { useCartRender } from "@/components/cart/context-sync";
import { prepareCheckoutAction } from "@/lib/cart/action";
import { cn, formatPrice } from "@/lib/utils";

function CheckoutLink({
  checkoutUrl,
  isUpdatingCart,
  updatingText,
  checkoutText,
}: {
  checkoutUrl: string;
  isUpdatingCart: boolean;
  updatingText: string;
  checkoutText: string;
}) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Reset pending state when returning from checkout (bfcache / back navigation)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsCheckingOut(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const baseClassName =
    "flex items-center justify-center w-full h-12 rounded-lg text-sm font-medium bg-link text-link-foreground transition-colors";

  if (isUpdatingCart || isCheckingOut) {
    return (
      <span className={cn(baseClassName, "opacity-50 cursor-not-allowed")} aria-disabled="true">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{isCheckingOut ? checkoutText : updatingText}</span>
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(baseClassName, "hover:bg-link/90 cursor-pointer")}
      onClick={async () => {
        setIsCheckingOut(true);
        const { checkoutUrl: url } = await prepareCheckoutAction();
        window.location.href = url || checkoutUrl;
      }}
    >
      <span>{checkoutText}</span>
    </button>
  );
}

interface SummaryProps {
  locale: string;
}

export function Summary({ locale }: SummaryProps) {
  const t = useTranslations("cart");
  const { isUpdatingCart } = useCart();
  const cart = useCartRender();

  if (!cart) return null;

  const subtotal = cart.lines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0,
  );
  const currencyCode = cart.cost.subtotalAmount.currencyCode;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">{t("estimatedTotal")}</span>
          <span className="text-xl font-medium text-foreground">
            {formatPrice(subtotal, currencyCode, locale)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t("taxesAndShippingNote")}</p>
      </div>

      <CheckoutLink
        checkoutUrl={cart.checkoutUrl}
        isUpdatingCart={isUpdatingCart}
        updatingText={t("updatingCart")}
        checkoutText={t("completeCheckout")}
      />
    </div>
  );
}
