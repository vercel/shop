import { tool } from "ai";
import { z } from "zod";

import { updateCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../server";

export function updateCartItemTool() {
  return tool({
    description: `Update the quantity of an item in the cart.
IMPORTANT: You must call getCart first to get the lineId and merchandiseId of the item to update.
Use the lineId from getCart results, not the product or variant ID.`,
    inputSchema: z.object({
      lineId: z
        .string()
        .describe("The cart line item ID from getCart results (e.g. 'gid://shopify/CartLine/...')"),
      merchandiseId: z.string().describe("The merchandise/variant ID from getCart results"),
      quantity: z.number().min(1).max(99).describe("New quantity for the item"),
    }),
    execute: async ({ lineId, merchandiseId, quantity }) => {
      const { cart: cartId } = getAgentContext();

      if (!cartId) {
        return {
          success: false,
          error: "Cart not initialized. Please try again.",
        };
      }

      try {
        const updatedCart = await updateCart([{ id: lineId, merchandiseId, quantity }], cartId);

        return {
          success: true,
          message: `Updated quantity to ${quantity}`,
          cart: updatedCart,
        };
      } catch (error) {
        console.error("Failed to update cart item:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update cart item",
        };
      }
    },
  });
}
