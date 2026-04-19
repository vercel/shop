"use client";

import { useTranslations } from "next-intl";

import { useCartRender } from "@/components/cart/context-sync";
import { OverlayItem } from "@/components/cart/overlay-item";

interface CartItemsListProps {
  locale: string;
}

export function CartItemsList({ locale }: CartItemsListProps) {
  const cart = useCartRender();
  const t = useTranslations("cart");
  const lines = cart?.lines ?? [];

  return lines.length === 0 ? (
    <div className="text-center py-10">
      <p className="text-muted-foreground">{t("empty")}</p>
    </div>
  ) : (
    <ul className="space-y-5" aria-label={t("cartItemsLabel")}>
      {lines.map((item) => (
        <OverlayItem key={item.id} item={item} locale={locale} />
      ))}
    </ul>
  );
}
