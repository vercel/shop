import { CartIconClient } from "./cart-client";
import { cookies } from "next/headers";
import { getCart } from "@/lib/shopify/operations/cart";
import { ShoppingBagIcon } from "lucide-react";

export async function CartIcon() {
  const cartId = (await cookies()).get("shopify_cartId")?.value;
  const cart = cartId ? await getCart(cartId) : undefined;

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
