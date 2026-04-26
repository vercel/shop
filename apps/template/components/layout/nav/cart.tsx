import { HandbagIcon } from "lucide-react";
import { cookies } from "next/headers";

import { t } from "@/lib/i18n/server";
import { getCart } from "@/lib/shopify/operations/cart";

import { CartIconClient } from "./cart-client";

export async function CartIcon() {
  const [cartLabel, cartId] = await Promise.all([
    t("nav.cart"),
    cookies().then((c) => c.get("shopify_cartId")?.value),
  ]);
  const cart = cartId ? await getCart(cartId) : undefined;

  return <CartIconClient cartLabel={cartLabel} initialCart={cart ?? null} />;
}

export function CartIconFallback() {
  return (
    <span className="flex items-center justify-center gap-1.5 text-foreground">
      <HandbagIcon className="size-5" />
      <span className="sr-only">Cart</span>
    </span>
  );
}
