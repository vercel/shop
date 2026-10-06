import { defineTool } from "eve/tools";
import { z } from "zod";

import { getSessionCartId, mutateCart } from "../lib/cart";

export default defineTool({
  description:
    "Set the shopper's cart note only when asked. The note replaces any existing note, so read get-cart first and keep text the shopper wants to keep.",
  inputSchema: z.strictObject({ note: z.string().max(1000) }),
  execute: ({ note }, ctx) => mutateCart(getSessionCartId(ctx), { note }),
});
