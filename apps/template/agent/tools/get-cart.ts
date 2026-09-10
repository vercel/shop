import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description: "Read a minimal summary of the current cart before editing a line.",
  inputSchema: commerceSchemas["get-cart"],
  execute: (input, ctx) => callCommerce("get-cart", input, ctx),
});
