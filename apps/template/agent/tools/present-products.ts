import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Render chosen exact Shopify Product IDs from native catalog search. Filter only by product options explicitly requested by the shopper; otherwise use []. Never infer preferences from featured variants. Other authored product tools already render their results.",
  inputSchema: commerceSchemas["present-products"],
  execute: (input, ctx) => callCommerce("present-products", input, ctx),
});
