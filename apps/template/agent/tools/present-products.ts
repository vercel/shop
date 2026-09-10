import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Render exact Shopify Product IDs selected from catalog search. Pass every required option; nonmatching products are excluded.",
  inputSchema: commerceSchemas["present-products"],
  execute: (input, ctx) => callCommerce("present-products", input, ctx),
});
