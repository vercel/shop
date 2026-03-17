import type { ComponentPropsWithoutRef } from "react";

import { Price } from "@/components/product/price";
import { DiscountBadge } from "@/components/ui/discount-badge";
import { cn } from "@/lib/utils";

interface ProductPriceProps extends ComponentPropsWithoutRef<"div"> {
  amount: string;
  currencyCode: string;
  compareAtAmount?: string;
  locale?: string;
  size?: "default" | "sm";
}

export function ProductPrice({
  amount,
  currencyCode,
  compareAtAmount,
  locale,
  size = "default",
  className,
  ...props
}: ProductPriceProps) {
  const discountPercent =
    compareAtAmount && Number(compareAtAmount) > Number(amount)
      ? Math.round(((Number(compareAtAmount) - Number(amount)) / Number(compareAtAmount)) * 100)
      : null;

  const priceSize = size === "sm" ? "text-xl" : "text-3xl";
  const compareSize = size === "sm" ? "text-xl" : "text-3xl";

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)} {...props}>
      <Price
        amount={amount}
        currencyCode={currencyCode}
        locale={locale}
        className={cn(priceSize, "font-medium")}
      />
      {compareAtAmount && Number(compareAtAmount) > Number(amount) && (
        <Price
          amount={compareAtAmount}
          currencyCode={currencyCode}
          locale={locale}
          className={cn(compareSize, "font-medium line-through text-foreground/35")}
        />
      )}
      {discountPercent && <DiscountBadge percent={discountPercent} />}
    </div>
  );
}
