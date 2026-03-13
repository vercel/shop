"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/components/cart/context";

export function CartStatusClient({
  variantId,
  initialQuantity,
}: {
  variantId?: string;
  initialQuantity: number;
}) {
  const { cartWithPending } = useCart();
  const t = useTranslations("product");

  if (!variantId) return null;

  const itemInCart = cartWithPending?.lines.find(
    (item) => item.merchandise.id === variantId,
  );

  const quantity = itemInCart?.quantity ?? initialQuantity;

  if (quantity === 0) return null;

  return (
    <div className="text-sm text-positive flex items-center gap-2 p-3 bg-positive/10 border border-positive/20 rounded-lg">
      <span className="font-medium">✓</span>
      <span>
        {/* @ts-expect-error - ICU plural format not fully typed */}
        {t("inCart", { quantity })}
      </span>
    </div>
  );
}
