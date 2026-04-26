import { tool } from "ai";
import { z } from "zod";

import { getCollections } from "@/lib/shopify/operations/collections";

import { getAgentContext } from "../server";

export function listCollectionsTool() {
  return tool({
    description: `List all available product collections/categories in the store.
Use this when the user asks "what categories do you have?", "show me your departments", or wants to browse by category.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { user } = getAgentContext();
        const collections = await getCollections(user.locale);

        return {
          success: true,
          collections: collections.map((c) => ({
            title: c.title,
            handle: c.handle,
            description: c.description,
          })),
        };
      } catch (error) {
        console.error("Failed to list collections:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to list collections",
        };
      }
    },
  });
}
