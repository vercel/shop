import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description: "Browse products by collection handle from list-collections or page context.",
  inputSchema: commerceSchemas["browse-collection"],
  execute: (input, ctx) => callCommerce("browse-collection", input, ctx),
});
