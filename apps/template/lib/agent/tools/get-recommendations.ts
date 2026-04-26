import { tool } from "ai";
import { z } from "zod";

import { getProductRecommendations } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../server";

export function getRecommendationsTool() {
  return tool({
    description: `Get product recommendations for a given product.
Use this when the user asks "what goes well with this?" or wants similar/related products.
Returns AI-powered recommendations from Shopify.`,
    inputSchema: z.object({
      handle: z.string().describe("The product handle to get recommendations for"),
    }),
    execute: async ({ handle }) => {
      const { user } = getAgentContext();

      try {
        const recommendations = await getProductRecommendations(handle, user.locale);

        return {
          success: true,
          products: recommendations.slice(0, 5).map((p) => ({
            title: p.title,
            handle: p.handle,
            price: `${p.price.amount} ${p.price.currencyCode}`,
            available: p.availableForSale,
            image: p.featuredImage?.url ?? null,
          })),
        };
      } catch (error) {
        console.error("Failed to get recommendations:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get recommendations",
        };
      }
    },
  });
}
