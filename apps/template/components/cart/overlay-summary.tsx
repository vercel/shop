"use client";

import { DiscountForm } from "@/components/cart/discount-form";
import { Price } from "@/components/product/price";
import { cartDiscountAmount } from "@/lib/cart";
import type { Cart } from "@/lib/types";

interface OverlaySummaryProps {
  cart: Cart;
}

export function OverlaySummary({ cart }: OverlaySummaryProps) {
  const currencyCode = cart.cost.subtotalAmount.currencyCode;

  // Sum line totals locally — Shopify's `subtotalAmount` lags during optimistic updates.
  const lineSubtotal = cart.lines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0,
  );
  const estimatedTotal = Math.max(0, lineSubtotal - cartDiscountAmount(cart));
  return (
    <div className="grid gap-2.5">
      <DiscountForm cart={cart} />
      <div aria-label="Estimated total">
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">Estimated total</span>
          <Price
            amount={estimatedTotal.toString()}
            currencyCode={currencyCode}
            className="text-xl font-medium text-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Taxes and shipping calculated at checkout.
        </p>
      </div>
    </div>
  );
}
