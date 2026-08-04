import { tool } from "ai";
import { z } from "zod";

import { searchShopPoliciesAndFaqs } from "@/lib/shopify/storefront";

export const searchShopPoliciesTool = tool({
  description:
    "Answer store policy, shipping, returns, payment, warranty, sizing, care, and FAQ questions " +
    "from Shopify's own content. Never guess these answers.",
  inputSchema: z.object({
    context: z.string().optional(),
    query: z.string(),
  }),
  execute: async ({ context, query }) => {
    try {
      return { answers: await searchShopPoliciesAndFaqs({ context, query }) };
    } catch (error) {
      console.error("Failed to search shop policies:", error);
      return { error: "Store policy information is unavailable right now." };
    }
  },
});
