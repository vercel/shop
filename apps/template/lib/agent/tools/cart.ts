import { tool } from "ai";
import { z } from "zod";

import { getCartById, runCartMutation } from "@/lib/cart/server";
import type { Cart } from "@/lib/types";

import { getAgentContext } from "../server";

/**
 * The client renders the live cart, so tools return only what the model needs to
 * narrate the turn plus the cart the reconciler syncs into cart context.
 */
function cartSummary(cart: Cart | undefined) {
  if (!cart || cart.lines.length === 0) return { cart: null, empty: true as const };
  return {
    cart,
    empty: false as const,
    lines: cart.lines.map((line) => ({
      lineId: line.id,
      options: line.merchandise.selectedOptions.map((option) => option.value).join(" / "),
      productTitle: line.merchandise.product.title,
      quantity: line.quantity,
      variantId: line.merchandise.id,
    })),
    totalQuantity: cart.totalQuantity,
  };
}

export const getCartTool = tool({
  description:
    "Read the shopper's current cart. Call this before updating or removing items to obtain line IDs.",
  inputSchema: z.object({}),
  execute: async () => {
    const { cart: cartId } = getAgentContext();
    if (!cartId) return { cart: null, empty: true };

    try {
      return cartSummary(await getCartById(cartId));
    } catch (error) {
      console.error("Failed to get cart:", error);
      return { error: "The cart is unavailable right now." };
    }
  },
});

export const addToCartTool = tool({
  description:
    "Add a product variant to the cart using a ProductVariant ID from getProductDetails. " +
    "Never pass a product ID. Confirm the variant first when a product has several.",
  inputSchema: z.object({
    quantity: z.number().min(1).max(99).default(1),
    variantId: z.string(),
  }),
  execute: async ({ quantity, variantId }) => {
    const { cart: cartId } = getAgentContext();
    if (!cartId) return { error: "The cart is not ready yet. Ask the shopper to try again." };

    try {
      const { cart } = await runCartMutation(
        { lines: [{ merchandiseId: variantId, quantity }] },
        cartId,
      );
      return { added: true, ...cartSummary(cart) };
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return { error: "Could not add that item to the cart." };
    }
  },
});

export const updateCartItemTool = tool({
  description:
    "Change a cart line's quantity, or remove it by passing 0. Call getCart first to get the lineId.",
  inputSchema: z.object({
    lineId: z.string(),
    quantity: z.number().min(0).max(99),
  }),
  execute: async ({ lineId, quantity }) => {
    const { cart: cartId } = getAgentContext();
    if (!cartId) return { error: "The cart is not ready yet. Ask the shopper to try again." };

    try {
      const { cart } = await runCartMutation({ lines: [{ id: lineId, quantity }] }, cartId);
      return { removed: quantity === 0, updated: true, ...cartSummary(cart) };
    } catch (error) {
      console.error("Failed to update cart line:", error);
      return { error: "Could not update that cart line." };
    }
  },
});

export const addCartNoteTool = tool({
  description: "Attach a note to the cart for gift messages, delivery, or special instructions.",
  inputSchema: z.object({ note: z.string() }),
  execute: async ({ note }) => {
    const { cart: cartId } = getAgentContext();
    if (!cartId) return { error: "The cart is not ready yet. Ask the shopper to try again." };

    try {
      const { cart } = await runCartMutation({ note }, cartId);
      return { noteUpdated: true, ...cartSummary(cart) };
    } catch (error) {
      console.error("Failed to update cart note:", error);
      return { error: "Could not update the cart note." };
    }
  },
});
