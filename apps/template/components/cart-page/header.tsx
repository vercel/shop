"use client";

import { useTranslations } from "next-intl";

import { useCartRender } from "@/components/cart/context-sync";

export function Header() {
  const t = useTranslations("cart");
  const cart = useCartRender();
  const count = cart?.totalQuantity ?? 0;

  return (
    <div className="flex items-center gap-2.5">
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
        {t("shoppingCart")}
      </h1>
      {count > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-background">
          {count}
        </span>
      )}
    </div>
  );
}
