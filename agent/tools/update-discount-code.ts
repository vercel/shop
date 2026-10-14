import { defineTool } from "eve/tools";
import { z } from "zod";

import { getCart, getSessionCartId, mutateCart } from "../lib/cart";

export default defineTool({
  description:
    "Apply a discount code the shopper typed, or remove one from the cart. Never guess, suggest, or try codes the shopper did not give.",
  inputSchema: z.strictObject({
    action: z.enum(["apply", "remove"]),
    code: z.string().trim().min(1).max(255),
  }),
  execute: async ({ action, code }, ctx) => {
    const cartId = getSessionCartId(ctx);
    if (!cartId) return { error: "Open the storefront to change your cart." };
    const cart = await getCart(cartId);
    if (!cart) return { error: "Cart is unavailable. Refresh the storefront." };

    const normalized = code.toUpperCase();
    const codes = cart.discountCodes.map((discount) => discount.code);
    const present = codes.some((existing) => existing.toUpperCase() === normalized);
    if (action === "apply" && present) return { error: "That code is already on the cart." };
    if (action === "remove" && !present) return { error: "That code is not on the cart." };

    return mutateCart(cartId, {
      discountCodes:
        action === "apply"
          ? [...codes, normalized]
          : codes.filter((existing) => existing.toUpperCase() !== normalized),
    });
  },
});
