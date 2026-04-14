import type { ComponentPropsWithoutRef } from "react";

import { Price } from "@/components/product/price";
import { DiscountBadge } from "@/components/ui/discount-badge";
import { cn } from "@/lib/utils";

interface ProductPriceProps extends ComponentPropsWithoutRef<"div"> {
  amount: string;
  currencyCode: string;
  compareAtAmount?: string;
  locale?: string;
}

export function ProductPrice({
  amount,
  currencyCode,
  compareAtAmount,
  locale,
  className,
  ...props
}: ProductPriceProps) {
  const discountPercent =
    compareAtAmount && Number(compareAtAmount) > Number(amount)
      ? Math.round(((Number(compareAtAmount) - Number(amount)) / Number(compareAtAmount)) * 100)
      : null;

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)} {...props}>
      <Price
        amount={amount}
        currencyCode={currencyCode}
        locale={locale}
        className="text-xl"
      />
      {compareAtAmount && Number(compareAtAmount) > Number(amount) && (
        <Price
          amount={compareAtAmount}
          currencyCode={currencyCode}
          locale={locale}
          className="text-xl line-through text-foreground/35"
        />
      )}
      {discountPercent && <DiscountBadge percent={discountPercent} />}
    </div>
  );
}
