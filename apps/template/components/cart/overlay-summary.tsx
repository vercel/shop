"use client";

import { Price } from "@/components/product/price";
import type { NamespaceMessages } from "@/lib/i18n";
import type { Cart } from "@/lib/types";

interface OverlaySummaryProps {
  cart: Cart;
  labels: NamespaceMessages<"cart">;
  locale: string;
}

export function OverlaySummary({ cart, labels, locale }: OverlaySummaryProps) {
  const currencyCode = cart.cost.subtotalAmount.currencyCode;

  // Calculate subtotal from line items for accurate real-time display
  const subtotal = cart.lines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0,
  );

  return (
    <div aria-label={labels.estimatedTotal}>
      <div className="flex items-baseline justify-between">
        <span className="text-base text-muted-foreground">{labels.estimatedTotal}</span>
        <Price
          amount={subtotal.toString()}
          currencyCode={currencyCode}
          locale={locale}
          className="text-xl font-medium text-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{labels.taxesAndShippingNote}</p>
    </div>
  );
}
