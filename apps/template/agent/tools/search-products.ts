import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Keyword product search fallback when the Shopify catalog connection is unavailable. Automatically renders product cards. Pass only shopper-requested product options, or [] when none were requested; commerce country and language are already applied.",
  inputSchema: commerceSchemas["search-products"],
  execute: (input, ctx) => callCommerce("search-products", input, ctx),
});
