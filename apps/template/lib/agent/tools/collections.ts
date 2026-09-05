import { tool } from "ai";
import { z } from "zod";

import { getCollections } from "@/lib/shopify/operations/collections";
import { getCollectionProducts } from "@/lib/shopify/operations/products";

import { toAgentProduct } from "../products";

export const listCollectionsTool = tool({
  description: "List the store's collections and categories.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const collections = await getCollections();
      return {
        collections: collections.map((collection) => ({
          description: collection.description,
          handle: collection.handle,
          title: collection.title,
        })),
      };
    } catch (error) {
      console.error("Failed to list collections:", error);
      return { error: "Collections are unavailable right now." };
    }
  },
});

export const browseCollectionTool = tool({
  description:
    "Browse products in a collection. Get handles from listCollections or the current page context.",
  inputSchema: z.object({
    collection: z.string(),
    sortKey: z
      .enum(["best-matches", "price-low-to-high", "price-high-to-low", "BEST_SELLING", "CREATED"])
      .default("best-matches"),
  }),
  execute: async ({ collection, sortKey }) => {
    try {
      const { products } = await getCollectionProducts({
        collection,
        limit: 6,
        sortKey,
      });
      return { products: products.map(toAgentProduct) };
    } catch (error) {
      console.error("Failed to browse collection:", error);
      return { error: `Could not browse the "${collection}" collection.` };
    }
  },
});
