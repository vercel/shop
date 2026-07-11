import { tool } from "ai";
import { z } from "zod";

import { getProductRecommendationSets } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../server";

export function getRecommendationsTool() {
  return tool({
    description: `Get complementary and related recommendations for a product handle.`,
    inputSchema: z.object({ handle: z.string() }),
    execute: async ({ handle }) => {
      try {
        const { user } = getAgentContext();
        const { complementary, related } = await getProductRecommendationSets({
          handle,
          locale: user.locale,
        });
        const seen = new Set<string>();
        const products = [...complementary, ...related].filter((product) => {
          if (seen.has(product.handle)) return false;
          seen.add(product.handle);
          return true;
        });
        return {
          products: products.slice(0, 5).map((product) => ({
            available: product.availableForSale,
            handle: product.handle,
            image: product.featuredImage?.url ?? null,
            price: `${product.price.amount} ${product.price.currencyCode}`,
            title: product.title,
          })),
          success: true,
        };
      } catch (error) {
        console.error("Failed to get recommendations:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to get recommendations",
          success: false,
        };
      }
    },
  });
}
