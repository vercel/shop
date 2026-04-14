"use client";

import { useTranslations } from "next-intl";

import { formatPrice } from "@/lib/utils";

import { useCartRender } from "@/components/cart/context-sync";

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations("cart");
  const cart = useCartRender();

  if (!cart) return null;

  const subtotal = cart.lines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0,
  );
  const itemCount = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const formattedTotal = formatPrice(subtotal, cart.cost.subtotalAmount.currencyCode, locale);

  return (
    <h1 className="text-3xl font-semibold tracking-tight mb-8 lg:mb-12">
      <span>
        {t("cartTotalIs")} {formattedTotal}
      </span>
      <span className="opacity-30 ml-2">({t("itemCount", { count: itemCount })})</span>
    </h1>
  );
}
