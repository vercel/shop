"use client";

import { useTranslations } from "next-intl";

import { useCartRender } from "@/components/cart/context-sync";
import { ItemRow } from "./item-row";

interface ItemsSectionProps {
  locale: string;
}

export function ItemsSection({ locale }: ItemsSectionProps) {
  const cart = useCartRender();
  const t = useTranslations("cart");
  const lines = cart?.lines ?? [];

  return (
    <div className="space-y-4">
      {lines.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lines.map((item) => (
            <ItemRow key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
