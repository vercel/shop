import { tool } from "ai";
import { z } from "zod";

export function navigateTool() {
  return tool({
    description: `Generate an on-site URL for a product, collection, search, cart, account, checkout, or home page.`,
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
    execute: ({ destination, identifier }) => {
      const routes: Record<string, { label: string; url: string }> = {
        account: { label: "Your Profile", url: "/account/profile" },
        addresses: { label: "Your Addresses", url: "/account/addresses" },
        cart: { label: "Shopping Cart", url: "/cart" },
        home: { label: "Home", url: "/" },
        orders: { label: "Your Orders", url: "/account/orders" },
      };
      if (destination === "product" && identifier) {
        return { label: "View Product", success: true, url: `/products/${identifier}` };
      }
      if (destination === "collection" && identifier) {
        return { label: "Browse Collection", success: true, url: `/collections/${identifier}` };
      }
      if (destination === "search") {
        const query = identifier ? `?q=${encodeURIComponent(identifier)}` : "";
        return {
          label: identifier ? `Search for "${identifier}"` : "Search",
          success: true,
          url: `/search${query}`,
        };
      }
      if (destination === "checkout") {
        return { label: "Go to Cart to Checkout", success: true, url: "/cart" };
      }
      const route = routes[destination];
      return route
        ? { ...route, success: true }
        : { error: `Unknown destination: ${destination}`, success: false };
    },
  });
}
