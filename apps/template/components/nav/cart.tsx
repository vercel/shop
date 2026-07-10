import { HandbagIcon } from "lucide-react";

import { withFallback } from "@/lib/shopify/errors";
import { getCart } from "@/lib/shopify/operations/cart";

import { CartIconClient } from "./cart-client";

export async function CartIcon() {
  const cart = await withFallback(getCart(), undefined);

  return <CartIconClient initialCart={cart ?? null} />;
}

export function CartIconFallback() {
  return (
    <span className="flex items-center justify-center gap-1.5 text-foreground">
      <HandbagIcon className="size-5" />
      <span className="sr-only">Cart</span>
    </span>
  );
}
