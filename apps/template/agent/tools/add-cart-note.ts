import { defineTool } from "eve/tools";
import { z } from "zod";

import { getSessionCartId, mutateCart } from "../lib/cart";

export default defineTool({
  description: "Attach a note to the shopper's current cart only when asked.",
  inputSchema: z.strictObject({ note: z.string() }),
  execute: ({ note }, ctx) => mutateCart(getSessionCartId(ctx), { note }),
});
