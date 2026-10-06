import { getSearchResultUrl } from "@shopify/hydrogen";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { shopConfig } from "../../lib/config";

const DESTINATIONS = z.enum([
  "account",
  "addresses",
  "cart",
  "checkout",
  "collection",
  "home",
  "orders",
  "product",
  "search",
]);

const destinationSchema: z.ZodType<z.infer<typeof DESTINATIONS>> = shopConfig.auth.isEnabled
  ? DESTINATIONS
  : DESTINATIONS.exclude(["account", "addresses", "orders"]);

export default defineTool({
  description:
    "Build a safe storefront link. Checkout goes to the cart, where the shopper confirms checkout.",
  inputSchema: z.strictObject({
    destination: destinationSchema,
    identifier: z.string().max(255).optional(),
  }),
  execute: ({ destination, identifier }) => {
    const handle = identifier?.replace(/[^a-zA-Z0-9_-]/g, "");
    switch (destination) {
      case "account":
        return { url: "/account/profile" };
      case "addresses":
        return { url: "/account/addresses" };
      case "cart":
      case "checkout":
        return { url: "/cart" };
      case "collection":
        return { url: handle ? `/collections/${handle}` : "/collections" };
      case "orders":
        return { url: "/account/orders" };
      case "product":
        return { url: handle ? `/products/${handle}` : "/" };
      case "search":
        return {
          url: identifier
            ? getSearchResultUrl({ baseUrl: "/search", term: identifier })
            : "/search",
        };
      default:
        return { url: "/" };
    }
  },
});
