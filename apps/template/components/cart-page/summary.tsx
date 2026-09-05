"use client";

import { formatMoney } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { cn } from "cn";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useCartRender } from "@/components/cart/context";
import { DiscountForm } from "@/components/cart/discount-form";
import { prepareCheckoutAction } from "@/lib/cart/action";
import { shopConfig } from "@/lib/config";

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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Reset pending state when returning from checkout (bfcache / back navigation)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsCheckingOut(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const baseClassName =
    "flex items-center justify-center w-full h-12 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors";

  return (
    <div className="grid gap-2.5">
      <button
        type="button"
        className={cn(
          baseClassName,
          "cursor-pointer hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
        )}
        disabled={isUpdatingCart || isCheckingOut || !checkoutUrl}
        aria-busy={isCheckingOut || isUpdatingCart || undefined}
        onClick={async () => {
          if (isUpdatingCart || isCheckingOut || !checkoutUrl) return;
          setCheckoutError(null);
          setIsCheckingOut(true);
          try {
            const { checkoutUrl: url } = await prepareCheckoutAction();
            if (!url) {
              setIsCheckingOut(false);
              setCheckoutError("Checkout is unavailable. Refresh your cart and try again.");
              return;
            }
            window.location.href = url;
          } catch {
            setIsCheckingOut(false);
            setCheckoutError("We couldn't start checkout. Please try again.");
          }
        }}
      >
        <span className="flex items-center gap-2.5">
          {isCheckingOut || isUpdatingCart ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          <span>{isUpdatingCart && !isCheckingOut ? updatingText : checkoutText}</span>
        </span>
      </button>
      {checkoutError ? (
        <p className="text-xs text-destructive" role="alert">
          {checkoutError}
        </p>
      ) : null}
    </div>
  );
}

interface SummaryProps {
  completeCheckoutLabel: string;
  estimatedTotalLabel: string;
  taxesAndShippingNote: string;
  updatingCartLabel: string;
}

export function Summary({
  completeCheckoutLabel,
  estimatedTotalLabel,
  taxesAndShippingNote,
  updatingCartLabel,
}: SummaryProps) {
  const cart = useCartRender();
  const isUpdatingCart = useCart((state) =>
    Boolean(
      state.loading ||
      state.revalidating ||
      state.pending.cost ||
      state.pending.lines.size ||
      state.pending.discountCodes.size ||
      state.pending.attributes ||
      state.pending.note,
    ),
  );
  const isCostPending = useCart((state) => Boolean(state.pending.cost || state.revalidating));
  if (!cart.lines.nodes.length) return null;
  const { amount, currencyCode } = cart.cost.totalAmount;
  return (
    <div className="space-y-5">
      <DiscountForm cart={cart} />
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">{estimatedTotalLabel}</span>
          <span className="text-xl font-medium text-foreground">
            {isCostPending || !currencyCode
              ? updatingCartLabel
              : formatMoney(
                  {
                    amount,
                    currencyCode,
                  },
                  {
                    locale: shopConfig.localization.locale,
                  },
                ).localizedString}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{taxesAndShippingNote}</p>
      </div>

      <CheckoutLink
        checkoutUrl={cart.checkoutUrl ?? ""}
        isUpdatingCart={isUpdatingCart}
        updatingText={updatingCartLabel}
        checkoutText={completeCheckoutLabel}
      />
    </div>
  );
}
