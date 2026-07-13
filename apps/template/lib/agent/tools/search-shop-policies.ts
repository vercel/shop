import { tool } from "ai";
import { z } from "zod";

import { searchShopPoliciesAndFaqs } from "@/lib/shopify/storefront";

export function searchShopPoliciesTool() {
  return tool({
    description: `Answer store policy, shipping, returns, payment, warranty, sizing, care, and FAQ questions from Shopify. Do not guess these answers.`,
    inputSchema: z.object({
      context: z.string().optional(),
      query: z.string(),
    }),
    execute: async ({ context, query }) => {
      try {
        const answers = await searchShopPoliciesAndFaqs({ context, query });
        return { answers, success: true };
      } catch (error) {
        console.error("Failed to search shop policies/FAQs via Storefront MCP:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to search policies",
          success: false,
        };
      }
    },
  });
}
