import { defineTool } from "eve/tools";
import { z } from "zod";

import { addToCartCore, createCartCore } from "@/lib/shopify/fetch";

import { getCartId, getLocale } from "../lib/session";

export default defineTool({
  description: `Add a product variant to the cart.

IMPORTANT: You must use the variant_id (e.g., "gid://shopify/ProductVariant/..."), NOT the product_id.
When the user is on a product page, the available variant IDs are provided in the context.
If there are multiple variants (sizes, colors), ask the user which one they want before calling this tool.
Do not add customized bundle parents that require components but have no fixed components.`,
  inputSchema: z.object({
    variant_id: z
      .string()
      .describe(
        "The Shopify variant ID (gid://shopify/ProductVariant/...). Get this from the product context.",
      ),
    quantity: z.number().min(1).max(99).default(1).describe("Quantity to add (defaults to 1)"),
  }),
  async execute({ quantity, variant_id }, ctx) {
    try {
      // The cart cookie rides same-origin requests into the channel AuthFn; when
      // absent (first cart action) we create a cart and return its id so the
      // client can persist the cookie (see CartReconciler).
      let cartId = getCartId(ctx);
      let createdCartId: string | undefined;
      if (!cartId) {
        const created = await createCartCore(getLocale(ctx));
        cartId = created.cart.id;
        createdCartId = created.cart.id;
      }
      if (!cartId) {
        return { success: false, error: "Could not initialize a cart. Please try again." };
      }

      const { cart: updatedCart } = await addToCartCore(
        [{ merchandiseId: variant_id, quantity }],
        cartId,
      );

      return {
        success: true,
        message: `Added ${quantity} item(s) to cart`,
        createdCartId,
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
