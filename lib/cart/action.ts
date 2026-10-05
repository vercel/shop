"use server";

import { getCart } from "@/lib/cart/server";
import { withFallback } from "@/lib/shopify/errors/server";

export async function prepareCheckoutAction(): Promise<{
  checkoutUrl: string | null;
}> {
  const cart = await withFallback(getCart(), undefined);
  return { checkoutUrl: cart?.checkoutUrl ?? null };
}
