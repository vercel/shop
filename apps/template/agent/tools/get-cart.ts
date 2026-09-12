import { defineTool } from "eve/tools";
import { z } from "zod";

import { getCart, getSessionCartId } from "../lib/cart";

export default defineTool({
  description: "Read a minimal summary of the current cart before editing a line.",
  inputSchema: z.strictObject({}),
  execute: async (_input, ctx) => {
    const cart = await getCart(getSessionCartId(ctx));
    if (!cart) return { error: "Cart is unavailable. Refresh the storefront." };
    return {
      empty: !cart.lines.nodes.length,
      lines: cart.lines.nodes.map((line) => ({
        lineId: line.id,
        options: line.merchandise.selectedOptions.map((option) => option.value).join(" / "),
        productTitle: line.merchandise.product.title,
        quantity: line.quantity,
        variantId: line.merchandise.id,
      })),
      totalQuantity: cart.totalQuantity,
    };
  },
});
