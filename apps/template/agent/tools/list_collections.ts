import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchCollections } from "@/lib/shopify/fetch";

import { getLocale } from "../lib/session";

export default defineTool({
  description: `List all available product collections/categories in the store.
Use this when the user asks "what categories do you have?", "show me your departments", or wants to browse by category.`,
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    try {
      const collections = await fetchCollections({ locale: getLocale(ctx) });

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
