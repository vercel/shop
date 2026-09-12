import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchSearchIndexProducts } from "../../lib/shopify/catalog/server";
import { matchingProducts, productOptionsSchema } from "../lib/catalog";

export default defineTool({
  description:
    "Keyword product search fallback when the Shopify catalog connection is unavailable. Automatically renders product cards. Pass only shopper-requested product options, or [] when none were requested; commerce country and language are already applied.",
  inputSchema: z.strictObject({
    options: productOptionsSchema,
    query: z.string().min(1).max(500),
    sortKey: z
      .enum(["best-matches", "price-low-to-high", "price-high-to-low"])
      .default("best-matches"),
  }),
  execute: async ({ options, query, sortKey }) => {
    const { products } = await fetchSearchIndexProducts({
      limit: options.length ? 50 : 12,
      query,
      sortKey,
    });
    return { products: await matchingProducts(products, options) };
  },
});
