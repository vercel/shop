"use client";

import { useTranslations } from "next-intl";

import { useCartRender } from "@/components/cart/context-sync";

import { ItemRow } from "./item-row";

interface CartItemsListProps {
  locale: string;
}

export function CartItemsList({ locale }: CartItemsListProps) {
  const cart = useCartRender();
  const t = useTranslations("cart");
  const lines = cart?.lines ?? [];

  return (
    <div className="space-y-5">
      {lines.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {lines.map((item) => (
            <ItemRow key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
