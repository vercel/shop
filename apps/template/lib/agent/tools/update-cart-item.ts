import { tool } from "ai";
import { z } from "zod";

import { updateCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../server";

export function updateCartItemTool() {
  return tool({
    description: `Update a cart line quantity. Call getCart first and use its lineId, not a product or variant ID.`,
    inputSchema: z.object({
      lineId: z.string(),
      quantity: z.number().min(1).max(99),
    }),
    execute: async ({ lineId, quantity }) => {
      const { cart: cartId } = getAgentContext();
      if (!cartId) return { error: "Cart not initialized. Please try again.", success: false };

      try {
        const { cart } = await updateCart([{ id: lineId, quantity }], cartId);
        return { cart, message: `Updated quantity to ${quantity}`, success: true };
      } catch (error) {
        console.error("Failed to update cart item:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to update cart item",
          success: false,
        };
      }
    },
  });
}
