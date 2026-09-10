import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description:
    "Set the quantity of an existing cart line, or remove it with quantity zero. Read get-cart first.",
  inputSchema: commerceSchemas["update-cart-item"],
  execute: (input, ctx) => callCommerce("update-cart-item", input, ctx),
});
