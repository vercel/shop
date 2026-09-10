import { defineTool } from "eve/tools";

import { commerceSchemas } from "../../lib/agent/commerce";
import { callCommerce } from "../lib/commerce";

export default defineTool({
  description: "List this store's collection handles, titles and descriptions.",
  inputSchema: commerceSchemas["list-collections"],
  execute: (input, ctx) => callCommerce("list-collections", input, ctx),
});
