import { tool } from "ai";
import { z } from "zod";

import { getProducts } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../context";

export function searchProductsTool() {
  return tool({
    description: `Search for products by keyword. Use this when the user asks to find products, is looking for something specific, or wants to browse by search query.
Returns a list of matching products with titles, prices, and availability.`,
    inputSchema: z.object({
      query: z.string().describe("Search query (e.g. 'blue jacket', 'wireless speaker')"),
      sortKey: z
        .enum(["best-matches", "price-low-to-high", "price-high-to-low"])
        .default("best-matches")
        .describe("How to sort results"),
      limit: z.number().min(1).max(10).default(5).describe("Number of results to return (max 10)"),
    }),
    execute: async ({ query, sortKey, limit }) => {
      const { user } = getAgentContext();

      try {
        const { products, total } = await getProducts({
          query,
          sortKey,
          limit,
          locale: user.locale,
        });

        return {
          success: true,
          total,
          products: products.map((p) => ({
            title: p.title,
            handle: p.handle,
            price: `${p.price.amount} ${p.price.currencyCode}`,
            compareAtPrice: p.compareAtPrice
              ? `${p.compareAtPrice.amount} ${p.compareAtPrice.currencyCode}`
              : null,
            available: p.availableForSale,
            vendor: p.vendor,
            image: p.featuredImage?.url ?? null,
          })),
        };
      } catch (error) {
        console.error("Failed to search products:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to search products",
        };
      }
    },
  });
}
