import { ShoppingBagIcon } from "lucide-react";
import { cookies } from "next/headers";

import { commerce } from "@/lib/commerce";

import { CartIconClient } from "./cart-client";

export async function CartIcon() {
  const cartId = (await cookies()).get("shopify_cartId")?.value;
  const cart = cartId ? await commerce.cart.getCart(cartId) : undefined;

  return <CartIconClient initialCart={cart ?? null} />;
}

export function CartIconFallback() {
  return (
    <span className="flex items-center justify-center gap-1.5 text-foreground">
      <ShoppingBagIcon className="size-5" />
      <span className="text-sm">Cart</span>
    </span>
  );
}
