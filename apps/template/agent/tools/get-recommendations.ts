import { defineTool } from "eve/tools";
import { z } from "zod";

import { toAgentProduct } from "../../lib/agent/products";
import { fetchComplementaryProducts, fetchRelatedProducts } from "../../lib/shopify/catalog/server";
import { productHandleSchema } from "../lib/catalog";

export default defineTool({
  description: "Show related and complementary products for a product handle.",
  inputSchema: z.strictObject({ handle: productHandleSchema }),
  execute: async ({ handle }) => {
    const [related, complementary] = await Promise.all([
      fetchRelatedProducts({ handle }),
      fetchComplementaryProducts({ handle }),
    ]);
    return {
      products: [
        ...new Map([...related, ...complementary].map((product) => [product.id, product])).values(),
      ]
        .slice(0, 12)
        .map(toAgentProduct),
    };
  },
});
