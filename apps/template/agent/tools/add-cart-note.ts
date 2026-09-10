import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description: "Attach a note to the shopper's current cart only when asked.",
  inputSchema: commerceSchemas["add-cart-note"],
  execute: (input, ctx) => callCommerce("add-cart-note", input, ctx),
});
