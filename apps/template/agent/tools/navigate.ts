import { defineTool } from "eve/tools";
import { z } from "zod";

import { buildAgentPath } from "../../lib/agent/routes";

export default defineTool({
  description:
    "Build a safe storefront link. Checkout goes to the cart, where the shopper confirms checkout.",
  inputSchema: z.strictObject({
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
    identifier: z.string().max(255).optional(),
  }),
  execute: ({ destination, identifier }) => ({
    url: buildAgentPath(
      destination,
      destination === "search" ? identifier : identifier?.replace(/[^a-zA-Z0-9_-]/g, ""),
    ),
  }),
});
