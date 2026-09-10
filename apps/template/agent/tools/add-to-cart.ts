import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Add a confirmed ProductVariant ID to the shopper's cart. Only when asked; never retry an uncertain change.",
  inputSchema: commerceSchemas["add-to-cart"],
  execute: (input, ctx) => callCommerce("add-to-cart", input, ctx),
});
