import { formatMoney } from "@shopify/hydrogen";
import { cn } from "cn";
import type * as React from "react";

import { shopConfig } from "@/lib/config";

interface PriceProps extends React.ComponentProps<"span"> {
  amount: string;
  currencyCode: string;
}

export function Price({ amount, currencyCode, className, ...props }: PriceProps) {
  const price = formatMoney(
    { amount, currencyCode },
    {
      currencyDisplay: "narrowSymbol",
      locale: shopConfig.localization.locale,
    },
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
