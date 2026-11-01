import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchPolicyAnswers, POLICY_TYPES } from "../../lib/shopify/operations/policies/server";

export default defineTool({
  description:
    "Answer questions about this store's shipping, returns, payments, warranty, sizing, care, contact details, policies, and FAQs.",
  inputSchema: z.strictObject({
    policyTypes: z
      .array(z.enum(POLICY_TYPES))
      .max(POLICY_TYPES.length)
      .optional()
      .describe(
        "Written policies the question touches, such as refund for returns or contact for hours. Omit for FAQ answers only.",
      ),
    query: z.string().trim().min(1).max(500).describe("The shopper's question."),
  }),
  execute: async ({ policyTypes, query }) => {
    try {
      return { results: await fetchPolicyAnswers({ policyTypes, query }) };
    } catch {
      return { error: "Store policies are unavailable." };
    }
  },
});
