"use client";

import type { CartData } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { Price } from "@/components/product/price";

const totalRowVariants = cva("flex items-baseline justify-between", {
  defaultVariants: { size: "default" },
  variants: {
    size: {
      compact: "font-medium text-sm",
      default: "text-base text-muted-foreground",
    },
  },
});

const totalAmountVariants = cva("font-medium", {
  defaultVariants: { size: "default" },
  variants: {
    size: {
      compact: "text-sm",
      default: "text-xl",
    },
  },
});

interface CartTotalProps extends VariantProps<typeof totalRowVariants> {
  cart: CartData;
}

export function CartTotal({ cart, size }: CartTotalProps) {
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
      <div className={totalRowVariants({ size })}>
        <span>Estimated total</span>
        {isCostPending || !currencyCode ? (
          <span className={cn(totalAmountVariants({ size }), "text-muted-foreground")}>
            Updating…
          </span>
        ) : (
          <Price
            amount={amount}
            className={totalAmountVariants({ size })}
            currencyCode={currencyCode}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">Taxes and shipping calculated at checkout.</p>
    </div>
  );
}
