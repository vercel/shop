import { defineTool } from "eve/tools";
import { z } from "zod";

import { updateCartCore } from "@/lib/shopify/fetch";

import { getCartId } from "../lib/session";

export default defineTool({
  description: `Update the quantity of an item in the cart.
IMPORTANT: You must call get_cart first to get the lineId of the item to update.
Use the lineId from get_cart results, not the product or variant ID.`,
  inputSchema: z.object({
    lineId: z
      .string()
      .describe("The cart line item ID from get_cart results (e.g. 'gid://shopify/CartLine/...')"),
    quantity: z.number().min(1).max(99).describe("New quantity for the item"),
  }),
  async execute({ lineId, quantity }, ctx) {
    const cartId = getCartId(ctx);
    if (!cartId) {
      return { success: false, error: "Cart not initialized. Please try again." };
    }

    try {
      const { cart: updatedCart } = await updateCartCore([{ id: lineId, quantity }], cartId);
      return { success: true, message: `Updated quantity to ${quantity}`, cart: updatedCart };
    } catch (error) {
      console.error("Failed to update cart item:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update cart item",
      };
    }
  },
});
