import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description: "Get current product details and render its interactive variant picker by handle.",
  inputSchema: commerceSchemas["get-product-details"],
  execute: (input, ctx) => callCommerce("get-product-details", input, ctx),
});
