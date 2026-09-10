"use server";

import { agentKey, agentStore } from "@/lib/agent/session/server";
import { getCart } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { withFallback } from "@/lib/shopify/errors/server";

export async function prepareCheckoutAction(): Promise<{
  checkoutUrl: string | null;
}> {
  const cart = await withFallback(getCart(), undefined);
  if (
    shopConfig.agent.isEnabled &&
    cart?.id &&
    (await agentStore().exists(agentKey("cart-lock", cart.id)))
  )
    return { checkoutUrl: null };
  return { checkoutUrl: cart?.checkoutUrl ?? null };
}
