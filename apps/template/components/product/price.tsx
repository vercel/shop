import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import { defaultLocale } from "@/lib/i18n";

interface PriceProps extends ComponentPropsWithoutRef<"span"> {
  amount: string;
  currencyCode: string;
  locale?: string;
}

export function Price({
  amount,
  currencyCode,
  locale,
  className,
  ...props
}: PriceProps) {
  const price = new Intl.NumberFormat(locale || defaultLocale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(Number(amount));

  return (
    <span
      className={cn("text-xl font-medium text-foreground", className)}
      {...props}
    >
      {price}
    </span>
  );
}
