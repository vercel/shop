import { tool } from "ai";
import { z } from "zod";
import { getCollectionProducts } from "@/lib/shopify/operations/products";
import { getAgentContext } from "../context";

export function browseCollectionTool() {
  return tool({
    description: `Browse products in a specific collection/category.
Use this when the user wants to see products in a particular category.
Get collection handles from the listCollections tool or the current page context.`,
    inputSchema: z.object({
      collection: z
        .string()
        .describe("The collection handle (e.g. 'electronics', 'clothing')"),
      sortKey: z
        .enum([
          "best-matches",
          "price-low-to-high",
          "price-high-to-low",
          "BEST_SELLING",
          "CREATED",
        ])
        .default("best-matches")
        .describe("How to sort results"),
      limit: z
        .number()
        .min(1)
        .max(10)
        .default(5)
        .describe("Number of products to return (max 10)"),
    }),
    execute: async ({ collection, sortKey, limit }) => {
      const { user } = getAgentContext();

      try {
        const { products, pageInfo } = await getCollectionProducts({
          collection,
          sortKey,
          limit,
          locale: user.locale,
        });

        return {
          success: true,
          hasMore: pageInfo.hasNextPage,
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
        console.error("Failed to browse collection:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to browse collection",
        };
      }
    },
  });
}
