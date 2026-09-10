import { defineTool } from "eve/tools";
import { z } from "zod";

import { toAgentProductDetails } from "../../lib/agent/products";
import { fetchProductWithVariants } from "../../lib/shopify/catalog/server";
import { productHandleSchema } from "../lib/catalog";
import { runCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Get details for a specific product and render its interactive variant picker. Use for product questions or purchase selection, not to display initial search-result cards.",
  inputSchema: z.strictObject({ handle: productHandleSchema }),
  execute: ({ handle }) =>
    runCommerce(async () => {
      const product = await fetchProductWithVariants({ handle });
      return product
        ? { product: toAgentProductDetails(product) }
        : { error: "Product not found." };
    }),
});
