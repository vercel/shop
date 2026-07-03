import { defineTool } from "eve/tools";
import { z } from "zod";

import { updateCartNoteCore } from "@/lib/shopify/fetch";

import { getCartId } from "../lib/session";

export default defineTool({
  description: `Add or update a note on the cart. Use this for special instructions, gift messages, or delivery notes.`,
  inputSchema: z.object({
    note: z.string().describe("The note to add to the cart (e.g. 'Please gift wrap this order')"),
  }),
  async execute({ note }, ctx) {
    const cartId = getCartId(ctx);
    if (!cartId) {
      return { success: false, error: "Cart not initialized. Please try again." };
    }

    try {
      const { cart: updatedCart } = await updateCartNoteCore(note, cartId);
      return { success: true, message: "Cart note updated", cart: updatedCart };
    } catch (error) {
      console.error("Failed to add cart note:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add cart note",
      };
    }
  },
});
