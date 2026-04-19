"use client";

import { useTranslations } from "next-intl";

import { useCartRender } from "@/components/cart/context-sync";

export function Header() {
  const t = useTranslations("cart");
  const cart = useCartRender();
  const count = cart?.totalQuantity ?? 0;

  return (
    <div className="flex items-center gap-2.5 mb-8 lg:mb-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("shoppingCart")}</h1>
      {count > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-background">
          {count}
        </span>
      )}
    </div>
  );
}
