import { createCartServerHandlers } from "@shopify/hydrogen";

import type { getHydrogenCustomerSession } from "@/lib/auth/request";
import { CART_FRAGMENT } from "@/lib/shopify/fragments/cart";

export const cartHandlers = createCartServerHandlers({ fragment: CART_FRAGMENT });

export function createCustomerCartHandlers(
  customerSession: Awaited<ReturnType<typeof getHydrogenCustomerSession>>,
) {
  return createCartServerHandlers({
    customerSession,
    fragment: CART_FRAGMENT,
  });
}
