import { formatMoney } from "@shopify/hydrogen";
import type * as React from "react";

import { defaultLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface PriceProps extends React.ComponentProps<"span"> {
  amount: string;
  currencyCode: string;
  locale?: string;
}

export function Price({ amount, currencyCode, locale, className, ...props }: PriceProps) {
  const price = formatMoney(
    { amount, currencyCode },
    { currencyDisplay: "narrowSymbol", locale: locale || defaultLocale },
  ).localizedString;

  return (
    <span
      className={cn("font-mono text-xl text-foreground tabular-nums tracking-tight", className)}
      {...props}
    >
      {price}
    </span>
  );
}
