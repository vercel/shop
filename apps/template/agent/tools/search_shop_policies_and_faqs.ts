import { defineTool } from "eve/tools";
import { z } from "zod";

import { searchShopPoliciesAndFaqs } from "@/lib/shopify/storefront";

export default defineTool({
  description: `Answer questions about the store's policies, shipping, returns, warranties, and FAQs using
Shopify's native Storefront MCP. Use when the shopper asks about returns, shipping, payment, order changes,
warranties, sizing/care, or similar store-policy questions — not for finding products.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe("The policy or FAQ question, e.g. 'What is your return policy for sale items?'"),
    context: z
      .string()
      .optional()
      .describe("Optional extra context, e.g. the product the shopper is currently viewing"),
  }),
  async execute({ context, query }) {
    try {
      const answers = await searchShopPoliciesAndFaqs({ context, query });
      return { success: true, answers };
    } catch (error) {
      console.error("Failed to search shop policies/FAQs via Storefront MCP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search policies",
      };
    }
  },
});
