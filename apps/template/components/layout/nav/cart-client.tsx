"use client";

import { HandbagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useCart } from "@/components/cart/context";
import { Badge } from "@/components/ui/badge";
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
      className="flex items-center justify-center gap-1.5 text-foreground hover:text-foreground/80 transition-colors"
      type="button"
    >
      <span className="relative">
        <HandbagIcon className="size-5" />
        {quantity > 0 && (
          <Badge className="absolute -top-2 -right-1 size-4 p-0 text-[10px] leading-none flex items-center justify-center">
            {quantity}
          </Badge>
        )}
      </span>
      <span className="sr-only">{t("cart")}</span>
    </button>
  );
}
