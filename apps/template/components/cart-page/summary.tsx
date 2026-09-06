"use client";

import { formatMoney } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { Loader2 } from "lucide-react";

import { DiscountForm } from "@/components/cart/discount-form";
import { useCheckout } from "@/hooks/use-checkout";
import type { Cart } from "@/lib/cart";
import { shopConfig } from "@/lib/config";

function CheckoutButton() {
  const {
    checkoutError,
    checkoutErrorId,
    handleCheckout,
    isCheckingOut,
    isCheckoutDisabled,
    isUpdatingCart,
  } = useCheckout();

  return (
    <div className="grid gap-2.5">
      <button
        type="button"
        className="flex items-center justify-center w-full h-12 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors cursor-pointer hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isCheckoutDisabled}
        aria-busy={isCheckingOut || isUpdatingCart || undefined}
        aria-describedby={checkoutError ? checkoutErrorId : undefined}
        onClick={handleCheckout}
      >
        <span className="flex items-center gap-2.5">
          {isCheckingOut || isUpdatingCart ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          <span>{isUpdatingCart && !isCheckingOut ? "Updating cart..." : "Go to Checkout"}</span>
        </span>
      </button>
      {checkoutError ? (
        <p className="text-xs text-destructive" id={checkoutErrorId} role="alert">
          {checkoutError}
        </p>
      ) : null}
    </div>
  );
}

export function Summary() {
  const cart = useCart<Cart, Cart>((state) => state.data);
  const isCostPending = useCart((state) => Boolean(state.pending.cost || state.revalidating));
  if (!cart.lines.nodes.length) return null;
  const { amount, currencyCode } = cart.cost.totalAmount;
  return (
    <div className="space-y-5">
      <DiscountForm cart={cart} />
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">Estimated total</span>
          <span
            className="font-mono text-xl font-medium text-foreground tabular-nums tracking-tight data-[pending=true]:text-muted-foreground"
            data-pending={isCostPending || !currencyCode}
          >
            {isCostPending || !currencyCode
              ? "Updating cart..."
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
        <p className="text-xs text-muted-foreground mt-1">
          Taxes and shipping calculated at checkout.
        </p>
      </div>

      <CheckoutButton />
    </div>
  );
}
