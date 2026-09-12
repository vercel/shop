import { defineTool } from "eve/tools";
import { z } from "zod";

import { getSessionCartId, mutateCart } from "../lib/cart";

export default defineTool({
  description:
    "Add a confirmed ProductVariant ID to the shopper's cart. Only when asked; never retry an uncertain change.",
  inputSchema: z.strictObject({
    quantity: z.number().int().min(1).max(99).default(1),
    variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/[0-9]+$/),
  }),
  execute: ({ quantity, variantId }, ctx) =>
    mutateCart(getSessionCartId(ctx), { lines: [{ merchandiseId: variantId, quantity }] }),
});
