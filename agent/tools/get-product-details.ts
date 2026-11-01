import { defineTool } from "eve/tools";
import { z } from "zod";

import { toAgentProductDetails } from "../../lib/agent/products";
import { fetchProductWithVariants } from "../../lib/shopify/operations/products/server";
import { productHandleSchema, toModelProductDetails } from "../lib/catalog";

export default defineTool({
  description:
    "Get details for a specific product, such as its description, options, and variant availability when the variant list is complete.",
  inputSchema: z.strictObject({
    handle: productHandleSchema,
    showOptions: z
      .boolean()
      .default(false)
      .describe(
        "Show the shopper this product's option picker. Only when they want to choose options themselves, not to answer a question or before adding a variant you chose.",
      ),
  }),
  execute: async ({ handle }) => {
    const product = await fetchProductWithVariants({ handle });
    return product ? { product: toAgentProductDetails(product) } : { error: "Product not found." };
  },
  toModelOutput: toModelProductDetails,
});
