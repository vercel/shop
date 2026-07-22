"use client";

import { HandbagIcon } from "lucide-react";

import { useCart, useSeedCart } from "@/components/cart/context";
import type { Cart } from "@/lib/types";

export function CartIconClient({
  cartLabel,
  initialCart,
}: {
  cartLabel: string;
  initialCart: Cart | null;
}) {
  const { cartWithPending, openOverlay } = useCart();

  useSeedCart(initialCart);

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
          <span className="absolute -top-2 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-xxs leading-none text-background">
            {quantity}
          </span>
        )}
      </span>
      <span className="sr-only">{cartLabel}</span>
    </button>
  );
}
