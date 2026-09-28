import { cn } from "cn";
import type { ComponentProps } from "react";

import { DiscountBadge } from "@/components/product/discount-badge";
import { Price } from "@/components/product/price";
import { isMarkedDown } from "@/lib/product";

interface ProductPriceProps extends ComponentProps<"div"> {
  amount: string;
  currencyCode: string;
  compareAtAmount?: string;
}

export function ProductPrice({
  amount,
  currencyCode,
  compareAtAmount,
  className,
  ...props
}: ProductPriceProps) {
  const markedDown = isMarkedDown(amount, compareAtAmount);
  const discountPercent = markedDown
    ? Math.round(((Number(compareAtAmount) - Number(amount)) / Number(compareAtAmount)) * 100)
    : null;
  return (
    <div className={cn("flex items-center gap-2.5 flex-wrap", className)} {...props}>
      <Price amount={amount} currencyCode={currencyCode} className="text-xl" />
      {markedDown && (
        <Price
          amount={compareAtAmount}
          currencyCode={currencyCode}
          className="text-xl line-through text-foreground/35"
        />
      )}
      {discountPercent && <DiscountBadge percent={discountPercent} />}
    </div>
  );
}
