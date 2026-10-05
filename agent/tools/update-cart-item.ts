import { defineTool } from "eve/tools";
import { z } from "zod";

import { getCart, getSessionCartId, mutateCart } from "../lib/cart";

export default defineTool({
  description:
    "Set the quantity of an existing cart line, or remove it with quantity zero. Read get-cart first.",
  inputSchema: z.strictObject({
    lineId: z.string().regex(/^gid:\/\/shopify\/CartLine\/[^\s]+$/),
    quantity: z.number().int().min(0).max(99),
  }),
  execute: async ({ lineId, quantity }, ctx) => {
    const cartId = getSessionCartId(ctx);
    if (!cartId) return { error: "Open the storefront to change your cart." };
    const cart = await getCart(cartId);
    if (!cart?.lines.nodes.some((line) => line.id === lineId))
      return { error: "This line is not in the current cart." };
    return mutateCart(cartId, { lines: [{ id: lineId, quantity }] });
  },
});
