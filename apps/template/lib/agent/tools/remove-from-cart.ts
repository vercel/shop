import { tool } from "ai";
import { z } from "zod";

import { removeFromCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../server";

export function removeFromCartTool() {
  return tool({
    description: `Remove a cart line. Call getCart first and use its lineId, not a product or variant ID.`,
    inputSchema: z.object({ lineId: z.string() }),
    execute: async ({ lineId }) => {
      const { cart: cartId } = getAgentContext();
      if (!cartId) return { error: "Cart not initialized. Please try again.", success: false };

      try {
        const { cart } = await removeFromCart([lineId], cartId);
        return { cart, message: "Item removed from cart", success: true };
      } catch (error) {
        console.error("Failed to remove from cart:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to remove item from cart",
          success: false,
        };
      }
    },
  });
}
