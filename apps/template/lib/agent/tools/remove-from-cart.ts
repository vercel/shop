import { tool } from "ai";
import { z } from "zod";

import { removeFromCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../context";

export function removeFromCartTool() {
  return tool({
    description: `Remove an item from the cart.
IMPORTANT: You must call getCart first to get the lineId of the item to remove.
Use the lineId from getCart results, not the product or variant ID.`,
    inputSchema: z.object({
      lineId: z
        .string()
        .describe("The cart line item ID from getCart results (e.g. 'gid://shopify/CartLine/...')"),
    }),
    execute: async ({ lineId }) => {
      const { cart: cartId } = getAgentContext();

      if (!cartId) {
        return {
          success: false,
          error: "Cart not initialized. Please try again.",
        };
      }

      try {
        const updatedCart = await removeFromCart([lineId], cartId);

        return {
          success: true,
          message: "Item removed from cart",
          cart: updatedCart,
        };
      } catch (error) {
        console.error("Failed to remove from cart:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to remove item from cart",
        };
      }
    },
  });
}
