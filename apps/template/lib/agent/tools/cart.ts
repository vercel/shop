import { tool } from "ai";
import { z } from "zod";

import {
  addCartNoteInputSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
} from "@/lib/agent/cart";
import type { Cart } from "@/lib/cart";
import { getCartById } from "@/lib/cart/server";

interface CartToolsOptions {
  cartId: string | undefined;
}

function cartSummary(cart: Cart | undefined) {
  if (!cart) return { empty: true as const };
  return {
    empty: cart.lines.nodes.length === 0,
    lines: cart.lines.nodes.map((line) => ({
      lineId: line.id,
      options: line.merchandise.selectedOptions.map((option) => option.value).join(" / "),
      productTitle: line.merchandise.product.title,
      quantity: line.quantity,
      variantId: line.merchandise.id,
    })),
    totalQuantity: cart.totalQuantity,
  };
}

// Older browser histories still contain full carts, including gift-card recipient details.
function cartModelOutput({ output }: { output: unknown }) {
  if (output && typeof output === "object" && "cart" in output) {
    const { cart: _cart, ...summary } = output;
    return { type: "text" as const, value: JSON.stringify(summary) };
  }
  return { type: "text" as const, value: JSON.stringify(output) };
}

export function createCartTools({ cartId }: CartToolsOptions) {
  const getCart = tool({
    description:
      "Read the shopper's current cart. Call this before updating or removing items to obtain line IDs.",
    inputSchema: z.object({}),
    toModelOutput: cartModelOutput,
    execute: async () => {
      if (!cartId) return { empty: true };

      try {
        return cartSummary(await getCartById(cartId));
      } catch (error) {
        console.error("Failed to get cart:", error);
        return { error: "The cart is unavailable right now." };
      }
    },
  });

  const addToCart = tool({
    description:
      "Add a product variant to the cart using a ProductVariant ID from getProductDetails. " +
      "Never pass a product ID. Confirm the variant first when a product has several.",
    inputSchema: addToCartInputSchema,
    toModelOutput: cartModelOutput,
  });

  const updateCartItem = tool({
    description:
      "Change a cart line's quantity, or remove it by passing 0. Call getCart first to get the lineId.",
    inputSchema: updateCartItemInputSchema,
    toModelOutput: cartModelOutput,
  });

  const addCartNote = tool({
    description: "Attach a note to the cart for gift messages, delivery, or special instructions.",
    inputSchema: addCartNoteInputSchema,
    toModelOutput: cartModelOutput,
  });

  return { addCartNote, addToCart, getCart, updateCartItem };
}
