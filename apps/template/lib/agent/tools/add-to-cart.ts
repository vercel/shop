import { tool } from "ai";
import { z } from "zod";

import { addToCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../server";

export function addToCartTool() {
  return tool({
    description: `Add a product variant to the cart.

IMPORTANT: You must use the variant_id (e.g., "gid://shopify/ProductVariant/..."), NOT the product_id.
When the user is on a product page, the available variant IDs are provided in the context.
If there are multiple variants (sizes, colors), ask the user which one they want before calling this tool.`,
    inputSchema: z.object({
      variant_id: z
        .string()
        .describe(
          "The Shopify variant ID (gid://shopify/ProductVariant/...). Get this from the product context.",
        ),
      quantity: z.number().min(1).max(99).default(1).describe("Quantity to add (defaults to 1)"),
    }),
    execute: async ({ variant_id, quantity }) => {
      const { cart: cartId, page, user } = getAgentContext();

      // Cart is pre-created by the chat route before streaming starts
      if (!cartId) {
        return {
          success: false,
          error: "Cart not initialized. Please try again.",
        };
      }

      try {
        const updatedCart = await addToCart(
          [{ merchandiseId: variant_id, quantity }],
          cartId,
          user.locale,
        );

        // Include product title in response if we have context
        let productInfo = "";
        if (page?.type === "product") {
          const { product } = page;
          const variant = product.variants.find((v) => v.id === variant_id);
          if (variant) {
            productInfo = ` (${product.title} - ${variant.title})`;
          }
        }

        return {
          success: true,
          message: `Added ${quantity}x${productInfo} to cart`,
          // Return full cart for client-side update via onToolCall
          cart: updatedCart,
        };
      } catch (error) {
        console.error("Failed to add product to cart:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to add product to cart",
        };
      }
    },
  });
}
