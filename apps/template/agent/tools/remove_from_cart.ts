import { defineTool } from "eve/tools";
import { z } from "zod";

import { removeFromCartCore } from "@/lib/shopify/operations/cart.fetch";

import { getCartId } from "../lib/session";

export default defineTool({
  description: `Remove an item from the cart.
IMPORTANT: You must call get_cart first to get the lineId of the item to remove.
Use the lineId from get_cart results, not the product or variant ID.`,
  inputSchema: z.object({
    lineId: z
      .string()
      .describe("The cart line item ID from get_cart results (e.g. 'gid://shopify/CartLine/...')"),
  }),
  async execute({ lineId }, ctx) {
    const cartId = getCartId(ctx);
    if (!cartId) {
      return { success: false, error: "Cart not initialized. Please try again." };
    }

    try {
      const { cart: updatedCart } = await removeFromCartCore([lineId], cartId);
      return { success: true, message: "Item removed from cart", cart: updatedCart };
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove item from cart",
      };
    }
  },
});
