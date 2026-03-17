import { tool } from "ai";
import { z } from "zod";

import { getCart } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../context";

export function getCartTool() {
  return tool({
    description: `View the current shopping cart contents.
Use this when the user asks "what's in my cart?", "how much is my order?", or when you need to look up line item IDs for updating/removing items.`,
    inputSchema: z.object({}),
    execute: async () => {
      const { cart: cartId } = getAgentContext();

      if (!cartId) {
        return {
          success: true,
          empty: true,
          message: "Cart is empty",
          items: [],
        };
      }

      try {
        const cart = await getCart(cartId);

        if (!cart || cart.lines.length === 0) {
          return {
            success: true,
            empty: true,
            message: "Cart is empty",
            items: [],
          };
        }

        return {
          success: true,
          empty: false,
          totalQuantity: cart.totalQuantity,
          subtotal: `${cart.cost.subtotalAmount.amount} ${cart.cost.subtotalAmount.currencyCode}`,
          total: `${cart.cost.totalAmount.amount} ${cart.cost.totalAmount.currencyCode}`,
          tax: `${cart.cost.totalTaxAmount.amount} ${cart.cost.totalTaxAmount.currencyCode}`,
          note: cart.note,
          checkoutUrl: cart.checkoutUrl,
          items: cart.lines.map((line) => ({
            lineId: line.id,
            productTitle: line.merchandise.product.title,
            variantTitle: line.merchandise.title,
            image: line.merchandise.product.featuredImage?.url ?? null,
            options: line.merchandise.selectedOptions
              .map((o) => `${o.name}: ${o.value}`)
              .join(", "),
            quantity: line.quantity,
            totalPrice: `${line.cost.totalAmount.amount} ${line.cost.totalAmount.currencyCode}`,
            handle: line.merchandise.product.handle,
            merchandiseId: line.merchandise.id,
          })),
          cart,
        };
      } catch (error) {
        console.error("Failed to get cart:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get cart",
        };
      }
    },
  });
}
