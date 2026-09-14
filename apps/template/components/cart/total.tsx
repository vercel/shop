"use client";

import type { CartData } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";

import { Price } from "@/components/product/price";

interface CartTotalProps {
  cart: CartData;
}

export function CartTotal({ cart }: CartTotalProps) {
  const isCostPending = useCart((state) =>
    Boolean(state.loading || state.pending.cost || state.revalidating),
  );
  const { amount, currencyCode } = cart.cost.totalAmount;
  return (
    <div
      aria-busy={isCostPending || undefined}
      aria-label="Estimated total"
      className="grid gap-1"
      role="group"
    >
      <div className="flex items-baseline justify-between text-base text-foreground">
        <span>Estimated total</span>
        {isCostPending || !currencyCode ? (
          <span className="font-medium text-muted-foreground text-xl">Updating…</span>
        ) : (
          <Price amount={amount} className="font-medium text-xl" currencyCode={currencyCode} />
        )}
      </div>
      <p className="text-muted-foreground text-xs">Taxes and shipping calculated at checkout.</p>
    </div>
  );
}
