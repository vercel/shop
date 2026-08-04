import { tool } from "ai";
import { z } from "zod";

import { buildAgentPath } from "../routes";

export const navigateTool = tool({
  description:
    "Build an on-site link for a product, collection, search, cart, checkout, account, or orders page. " +
    "Product and collection destinations require the handle as the identifier; search takes a query.",
  inputSchema: z.object({
    destination: z.enum([
      "account",
      "addresses",
      "cart",
      "checkout",
      "collection",
      "home",
      "orders",
      "product",
      "search",
    ]),
    identifier: z.string().optional(),
  }),
  execute: ({ destination, identifier }) => ({
    url: buildAgentPath(destination, identifier),
  }),
});
