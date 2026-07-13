import { tool } from "ai";
import { z } from "zod";

import { getCollections } from "@/lib/shopify/operations/collections";

import { getAgentContext } from "../server";

export function listCollectionsTool() {
  return tool({
    description: `List the store's available product collections and categories.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { user } = getAgentContext();
        const collections = await getCollections({ locale: user.locale });
        return {
          collections: collections.map((collection) => ({
            description: collection.description,
            handle: collection.handle,
            title: collection.title,
          })),
          success: true,
        };
      } catch (error) {
        console.error("Failed to list collections:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to list collections",
          success: false,
        };
      }
    },
  });
}
