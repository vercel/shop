import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description: "Show related and complementary products for a product handle.",
  inputSchema: commerceSchemas["get-recommendations"],
  execute: (input, ctx) => callCommerce("get-recommendations", input, ctx),
});
