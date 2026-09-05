"use client";

import type { CartData } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";

import { DiscountForm } from "@/components/cart/discount-form";
import { Price } from "@/components/product/price";

interface OverlaySummaryProps {
  cart: CartData;
}

export function OverlaySummary({ cart }: OverlaySummaryProps) {
  const isCostPending = useCart((state) =>
    Boolean(state.loading || state.pending.cost || state.revalidating),
  );
  const { amount, currencyCode } = cart.cost.totalAmount;
  return (
    <div className="grid gap-2.5">
      <DiscountForm cart={cart} />
      <div
        className="grid gap-1"
        aria-label="Estimated total"
        aria-busy={isCostPending || undefined}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">Estimated total</span>
          {isCostPending || !currencyCode ? (
            <span className="text-xl font-medium text-muted-foreground">Updating…</span>
          ) : (
            <Price
              amount={amount}
              currencyCode={currencyCode}
              className="text-xl font-medium text-foreground"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">Taxes and shipping calculated at checkout.</p>
      </div>
    </div>
  );
}
