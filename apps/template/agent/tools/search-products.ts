import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Keyword product search fallback. Preserve required product options and requested price sorting.",
  inputSchema: commerceSchemas["search-products"],
  execute: (input, ctx) => callCommerce("search-products", input, ctx),
});
