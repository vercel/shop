import type * as React from "react";

import { defaultLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface PriceProps extends React.ComponentProps<"span"> {
  amount: string;
  currencyCode: string;
  locale?: string;
}

export function Price({ amount, currencyCode, locale, className, ...props }: PriceProps) {
  const price = new Intl.NumberFormat(locale || defaultLocale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(Number(amount));

  return (
    <span className={cn("text-xl text-foreground", className)} {...props}>
      {price}
    </span>
  );
}
