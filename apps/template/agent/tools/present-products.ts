import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchProductsByIds } from "../../lib/shopify/catalog/server";
import { matchingProducts, productOptionsSchema } from "../lib/catalog";

export default defineTool({
  description:
    "Render chosen exact Shopify Product IDs from native catalog search. Filter only by product options explicitly requested by the shopper; otherwise use []. Never infer preferences from featured variants. Other authored product tools already render their results.",
  inputSchema: z.strictObject({
    ids: z.array(z.string().regex(/^gid:\/\/shopify\/Product\/[0-9]+$/)).max(12),
    options: productOptionsSchema,
  }),
  execute: async ({ ids, options }) => ({
    products: await matchingProducts(ids.length ? await fetchProductsByIds({ ids }) : [], options),
  }),
});
