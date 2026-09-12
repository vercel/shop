import { defineTool } from "eve/tools";
import { z } from "zod";

import { toAgentProduct } from "../../lib/agent/products";
import { fetchCollectionProducts } from "../../lib/shopify/catalog/server";
import { productHandleSchema } from "../lib/catalog";

export default defineTool({
  description: "Browse products by collection handle from list-collections or page context.",
  inputSchema: z.strictObject({
    collection: productHandleSchema,
    sortKey: z
      .enum(["best-matches", "price-low-to-high", "price-high-to-low", "BEST_SELLING", "CREATED"])
      .default("best-matches"),
  }),
  execute: async ({ collection, sortKey }) => {
    const { products } = await fetchCollectionProducts({ collection, limit: 12, sortKey });
    return { products: products.map(toAgentProduct) };
  },
});
