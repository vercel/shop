import { tool } from "ai";
import { z } from "zod";

import { updateCartNote } from "@/lib/shopify/operations/cart";

import { getAgentContext } from "../context";

export function addCartNoteTool() {
  return tool({
    description: `Add or update a note on the cart. Use this for special instructions, gift messages, or delivery notes.`,
    inputSchema: z.object({
      note: z.string().describe("The note to add to the cart (e.g. 'Please gift wrap this order')"),
    }),
    execute: async ({ note }) => {
      const { cart: cartId } = getAgentContext();

      if (!cartId) {
        return {
          success: false,
          error: "Cart not initialized. Please try again.",
        };
      }

      try {
        const updatedCart = await updateCartNote(note, cartId);

        if (!updatedCart) {
          return {
            success: false,
            error: "Failed to update cart note",
          };
        }

        return {
          success: true,
          message: "Cart note updated",
          cart: updatedCart,
        };
      } catch (error) {
        console.error("Failed to add cart note:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to add cart note",
        };
      }
    },
  });
}
