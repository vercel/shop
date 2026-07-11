import { tool } from "ai";
import { z } from "zod";

import { searchIndexProducts } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../server";

export function searchProductsTool() {
  return tool({
    description: `Search for products by keyword. Use this for exact product lookups or price-sorted searches.`,
    inputSchema: z.object({
      limit: z.number().min(1).max(10).default(5),
      query: z.string(),
      sortKey: z
        .enum(["best-matches", "price-low-to-high", "price-high-to-low"])
        .default("best-matches"),
    }),
    execute: async ({ limit, query, sortKey }) => {
      try {
        const { user } = getAgentContext();
        const { products, total } = await searchIndexProducts({
          limit,
          locale: user.locale,
          query,
          sortKey,
        });
        return {
          products: products.map((product) => ({
            available: product.availableForSale,
            compareAtPrice: product.compareAtPrice
              ? `${product.compareAtPrice.amount} ${product.compareAtPrice.currencyCode}`
              : null,
            handle: product.handle,
            image: product.featuredImage?.url ?? null,
            price: `${product.price.amount} ${product.price.currencyCode}`,
            title: product.title,
            vendor: product.vendor,
          })),
          success: true,
          total,
        };
      } catch (error) {
        console.error("Failed to search products:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to search products",
          success: false,
        };
      }
    },
  });
}
