import { defineTool } from "eve/tools";
import { z } from "zod";

import { toAgentProduct } from "../../lib/agent/products";
import { fetchCollectionProducts } from "../../lib/shopify/operations/products/server";
import { productHandleSchema } from "../lib/catalog";

export default defineTool({
  description: "Browse products by collection handle from list-collections or page context.",
  inputSchema: z.strictObject({
    collection: productHandleSchema,
    sortKey: z
      .enum(["manual", "best-selling", "created-descending", "price-ascending", "price-descending"])
      .default("manual"),
  }),
  execute: async ({ collection, sortKey }) => {
    const { products } = await fetchCollectionProducts({ collection, limit: 12, sortKey });
    return { products: products.map(toAgentProduct) };
  },
});
