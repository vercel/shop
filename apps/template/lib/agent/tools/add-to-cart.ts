import { tool } from "ai";
import { z } from "zod";

import { addToCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../server";

export function addToCartTool() {
  return tool({
    description: `Add a product variant to the cart. Use a ProductVariant GID, not a product GID. Ask for variant choices when needed. Do not add customized bundle parents that require components but have no fixed components.`,
    inputSchema: z.object({
      quantity: z.number().min(1).max(99).default(1),
      variantId: z.string(),
    }),
    execute: async ({ quantity, variantId }) => {
      const { cart: cartId, user } = getAgentContext();
      if (!cartId) return { error: "Cart not initialized. Please try again.", success: false };

      try {
        const { cart } = await addToCart(
          [{ merchandiseId: variantId, quantity }],
          cartId,
          user.locale,
        );
        return { cart, message: `Added ${quantity} item(s) to cart`, success: true };
      } catch (error) {
        console.error("Failed to add product to cart:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to add product to cart",
          success: false,
        };
      }
    },
  });
}
