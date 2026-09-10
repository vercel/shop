import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Get details for a specific product and render its interactive variant picker. Use for product questions or purchase selection, not to display initial search-result cards.",
  inputSchema: commerceSchemas["get-product-details"],
  execute: (input, ctx) => callCommerce("get-product-details", input, ctx),
});
