"use client";

import type { CartData } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";

import { Price } from "@/components/product/price";

interface CartTotalProps {
  cart: CartData;
  locale: string;
}

export function CartTotal({ cart, locale }: CartTotalProps) {
  const t = useTranslations("cart");
  const isCostPending = useCart((state) =>
    Boolean(state.loading || state.pending.cost || state.revalidating),
  );
  const { amount, currencyCode } = cart.cost.totalAmount;
  return (
    <div
      aria-busy={isCostPending || undefined}
      aria-label={t("estimatedTotal")}
      className="grid gap-1"
      role="group"
    >
      <div className="flex items-baseline justify-between text-base text-foreground">
        <span>{t("estimatedTotal")}</span>
        {isCostPending || !currencyCode ? (
          <span className="font-medium text-muted-foreground text-xl">{t("updatingCart")}</span>
        ) : (
          <Price
            amount={amount}
            className="font-medium text-xl"
            currencyCode={currencyCode}
            locale={locale}
          />
        )}
      </div>
      <p className="text-muted-foreground text-xs">{t("taxesAndShippingNote")}</p>
    </div>
  );
}
