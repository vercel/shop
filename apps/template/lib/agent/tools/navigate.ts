import { tool } from "ai";
import { z } from "zod";

export function navigateTool() {
  return tool({
    description: `Generate a URL to navigate the user to a specific page on the site.
Use this when the user says "take me to...", "show me...", "go to...", or you want to direct them to a relevant page.
Returns a URL that the user can click to navigate.`,
    inputSchema: z.object({
      destination: z
        .enum([
          "product",
          "collection",
          "search",
          "cart",
          "account",
          "orders",
          "addresses",
          "checkout",
          "home",
        ])
        .describe("The type of page to navigate to"),
      identifier: z
        .string()
        .optional()
        .describe("Product handle, collection handle, or search query (depending on destination)"),
    }),
    execute: async ({ destination, identifier }) => {
      const urls: Record<string, { url: string; label: string }> = {
        home: { url: "/", label: "Home" },
        cart: { url: "/cart", label: "Shopping Cart" },
        account: { url: "/account/profile", label: "Your Profile" },
        orders: { url: "/account/orders", label: "Your Orders" },
        addresses: {
          url: "/account/addresses",
          label: "Your Addresses",
        },
      };

      if (destination === "product" && identifier) {
        return {
          success: true,
          url: `/products/${identifier}`,
          label: `View Product`,
        };
      }

      if (destination === "collection" && identifier) {
        return {
          success: true,
          url: `/collections/${identifier}`,
          label: `Browse Collection`,
        };
      }

      if (destination === "search") {
        const query = identifier ? `?q=${encodeURIComponent(identifier)}` : "";
        return {
          success: true,
          url: `/search${query}`,
          label: identifier ? `Search for "${identifier}"` : "Search",
        };
      }

      if (destination === "checkout") {
        return {
          success: true,
          url: "/cart",
          label: "Go to Cart to Checkout",
        };
      }

      const route = urls[destination];
      if (route) {
        return {
          success: true,
          ...route,
        };
      }

      return {
        success: false,
        error: `Unknown destination: ${destination}`,
      };
    },
  });
}
