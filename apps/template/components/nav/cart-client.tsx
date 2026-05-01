"use client";

import { HandbagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useCart } from "@/components/cart/context";
import type { Cart } from "@/lib/types";

export function CartIconClient({ initialCart }: { initialCart: Cart | null }) {
  const { cartWithPending, openOverlay, setCart, cart } = useCart();
  const t = useTranslations("nav");

  useEffect(() => {
    if (cart === null && initialCart !== null) {
      setCart(initialCart);
    }
  }, [cart, initialCart, setCart]);

  const displayCart = cartWithPending ?? initialCart;
  const quantity = displayCart?.totalQuantity ?? 0;

  return (
    <button
      onClick={openOverlay}
      className="flex items-center justify-center gap-1.5 text-link hover:opacity-70 transition-opacity"
      type="button"
    >
      <span className="relative">
        <HandbagIcon className="size-5" />
        {quantity > 0 && (
          <span className="absolute -top-2 -right-1 flex size-4 items-center justify-center rounded-full bg-link text-xxs leading-none text-link-foreground">
            {quantity}
          </span>
        )}
      </span>
      <span className="sr-only">{t("cart")}</span>
    </button>
  );
}
