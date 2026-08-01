"use client";

import { useTranslations } from "next-intl";

import { DiscountForm } from "@/components/cart/discount-form";
import { Price } from "@/components/product/price";
import { cartDiscountAmount } from "@/lib/cart";
import type { Cart } from "@/lib/types";

interface OverlaySummaryProps {
  cart: Cart;
  locale: string;
}

export function OverlaySummary({ cart, locale }: OverlaySummaryProps) {
  const t = useTranslations("cart");
  const currencyCode = cart.cost.subtotalAmount.currencyCode;

  // Sum line totals locally — Shopify's `subtotalAmount` lags during optimistic updates.
  const lineSubtotal = cart.lines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0,
  );
  const estimatedTotal = Math.max(0, lineSubtotal - cartDiscountAmount(cart));

  return (
    <div className="grid gap-2.5">
      <DiscountForm cart={cart} locale={locale} />
      <div aria-label={t("estimatedTotal")}>
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">{t("estimatedTotal")}</span>
          <Price
            amount={estimatedTotal.toString()}
            currencyCode={currencyCode}
            locale={locale}
            className="text-xl font-medium text-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t("taxesAndShippingNote")}</p>
      </div>
    </div>
  );
}
