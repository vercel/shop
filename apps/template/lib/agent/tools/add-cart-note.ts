import { tool } from "ai";
import { z } from "zod";

import { updateCartNote } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../server";

export function addCartNoteTool() {
  return tool({
    description: `Add or update a cart note for special instructions, gift messages, or delivery notes.`,
    inputSchema: z.object({ note: z.string() }),
    execute: async ({ note }) => {
      const { cart: cartId } = getAgentContext();
      if (!cartId) return { error: "Cart not initialized. Please try again.", success: false };

      try {
        const result = await updateCartNote(note, cartId);
        if (!result) return { error: "Failed to update cart note", success: false };
        return { cart: result.cart, message: "Cart note updated", success: true };
      } catch (error) {
        console.error("Failed to add cart note:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to add cart note",
          success: false,
        };
      }
    },
  });
}
