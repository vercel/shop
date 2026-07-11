import { tool } from "ai";
import { z } from "zod";

import { getCollectionProducts } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../server";

export function browseCollectionTool() {
  return tool({
    description: `Browse products in a collection. Get handles from listCollections or the current page context.`,
    inputSchema: z.object({
      collection: z.string(),
      limit: z.number().min(1).max(10).default(5),
      sortKey: z
        .enum(["best-matches", "price-low-to-high", "price-high-to-low", "BEST_SELLING", "CREATED"])
        .default("best-matches"),
    }),
    execute: async ({ collection, limit, sortKey }) => {
      try {
        const { user } = getAgentContext();
        const { pageInfo, products } = await getCollectionProducts({
          collection,
          limit,
          locale: user.locale,
          sortKey,
        });
        return {
          hasMore: pageInfo.hasNextPage,
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
        };
      } catch (error) {
        console.error("Failed to browse collection:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to browse collection",
          success: false,
        };
      }
    },
  });
}
