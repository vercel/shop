"use client";

import type { CartData } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";

import { DiscountForm } from "@/components/cart/discount-form";
import { Price } from "@/components/product/price";

interface OverlaySummaryProps {
  cart: CartData;
  locale: string;
}

export function OverlaySummary({ cart, locale }: OverlaySummaryProps) {
  const t = useTranslations("cart");
  const isCostPending = useCart((state) =>
    Boolean(state.loading || state.pending.cost || state.revalidating),
  );
  const { amount, currencyCode } = cart.cost.totalAmount;
  return (
    <div className="grid gap-2.5">
      <DiscountForm cart={cart} />
      <div
        className="grid gap-1"
        aria-label={t("estimatedTotal")}
        aria-busy={isCostPending || undefined}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-base text-muted-foreground">{t("estimatedTotal")}</span>
          {isCostPending || !currencyCode ? (
            <span className="text-xl font-medium text-muted-foreground">{t("updatingCart")}</span>
          ) : (
            <Price
              locale={locale}
              amount={amount}
              currencyCode={currencyCode}
              className="text-xl font-medium text-foreground"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("taxesAndShippingNote")}</p>
      </div>
    </div>
  );
}
