import { defineTool } from "eve/tools";
import { z } from "zod";

import { toAgentProduct } from "../../lib/agent/products";
import type { SortValue } from "../../lib/collections/types";
import { fetchCollectionProducts } from "../../lib/shopify/operations/products/server";
import { productHandleSchema, toModelProducts } from "../lib/catalog";

export default defineTool({
  description: "Browse products by collection handle from list-collections or page context.",
  inputSchema: z.strictObject({
    collection: productHandleSchema,
    sortKey: z
      .enum([
        "manual",
        "best-selling",
        "created-descending",
        "price-ascending",
        "price-descending",
      ] as const satisfies readonly SortValue[])
      .default("manual"),
  }),
  execute: async ({ collection, sortKey }) => {
    const { products } = await fetchCollectionProducts({ collection, limit: 12, sortKey });
    if (!products.length)
      return {
        error: "No products found for this collection handle. Use list-collections for handles.",
      };
    return { products: products.map(toAgentProduct) };
  },
  toModelOutput: toModelProducts,
});
