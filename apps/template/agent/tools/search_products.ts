import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchSearchIndexProducts } from "@/lib/shopify/fetch";

import { getLocale } from "../lib/session";

export default defineTool({
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
  async execute({ limit, query, sortKey }, ctx) {
    try {
      const { products, total } = await fetchSearchIndexProducts({
        limit,
        locale: getLocale(ctx),
        query,
        sortKey,
      });

      return {
        success: true,
        total,
        products: products.map((p) => ({
          available: p.availableForSale,
          compareAtPrice: p.compareAtPrice
            ? `${p.compareAtPrice.amount} ${p.compareAtPrice.currencyCode}`
            : null,
          handle: p.handle,
          image: p.featuredImage?.url ?? null,
          price: `${p.price.amount} ${p.price.currencyCode}`,
          title: p.title,
          vendor: p.vendor,
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
