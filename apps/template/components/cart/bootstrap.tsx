import { CartContextSync } from "@/components/cart/context-sync";
import { withFallback } from "@/lib/shopify/errors";
import { getCart } from "@/lib/shopify/operations/cart";

export async function CartBootstrap() {
  const cart = await withFallback(getCart(), undefined);

  return <CartContextSync cart={cart ?? null}>{null}</CartContextSync>;
}
