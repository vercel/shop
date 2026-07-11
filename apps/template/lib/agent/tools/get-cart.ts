import { tool } from "ai";
import { z } from "zod";

import { getCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../server";

export function getCartTool() {
  return tool({
    description: `View the current cart. Call this before updating or removing items to obtain cart line IDs.`,
    inputSchema: z.object({}),
    execute: async () => {
      const { cart: cartId } = getAgentContext();
      if (!cartId) return { empty: true, items: [], message: "Cart is empty", success: true };

      try {
        const cart = await getCart(cartId);
        if (!cart || cart.lines.length === 0) {
          return { empty: true, items: [], message: "Cart is empty", success: true };
        }
        return {
          cart,
          checkoutUrl: cart.checkoutUrl,
          empty: false,
          items: cart.lines.map((line) => ({
            components: line.components.map((component) => ({
              productTitle: component.merchandise.product.title,
              quantity: component.quantity,
              variantTitle: component.merchandise.title,
            })),
            handle: line.merchandise.product.handle,
            image: line.merchandise.product.featuredImage?.url ?? null,
            lineId: line.id,
            merchandiseId: line.merchandise.id,
            options: line.merchandise.selectedOptions
              .map((option) => `${option.name}: ${option.value}`)
              .join(", "),
            productTitle: line.merchandise.product.title,
            quantity: line.quantity,
            totalPrice: `${line.cost.totalAmount.amount} ${line.cost.totalAmount.currencyCode}`,
            variantTitle: line.merchandise.title,
          })),
          note: cart.note,
          subtotal: `${cart.cost.subtotalAmount.amount} ${cart.cost.subtotalAmount.currencyCode}`,
          success: true,
          total: `${cart.cost.totalAmount.amount} ${cart.cost.totalAmount.currencyCode}`,
          totalQuantity: cart.totalQuantity,
        };
      } catch (error) {
        console.error("Failed to get cart:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to get cart",
          success: false,
        };
      }
    },
  });
}
