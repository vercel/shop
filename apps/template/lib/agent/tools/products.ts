import { tool } from "ai";
import { z } from "zod";

import {
  getComplementaryProducts,
  getProductsByIds,
  getProductWithVariants,
  getRelatedProducts,
  searchIndexProducts,
} from "@/lib/shopify/operations/products";
import { searchCatalog } from "@/lib/shopify/storefront";

import { toAgentProduct, toAgentProductDetails } from "../products";
import { getAgentContext } from "../server";

const RESULT_LIMIT = 6;

// Shopify's semantic catalog search returns GIDs only, so canonical fields always come
// from the Storefront API; a semantic miss falls back to the keyword index.
async function semanticProducts(query: string, intent: string | undefined, locale: string) {
  const { products = [] } = await searchCatalog({ intent, limit: RESULT_LIMIT, locale, query });
  const ids = products.map((product) => product.id);
  if (ids.length === 0) return [];
  const resolved = await getProductsByIds({ ids, locale });
  const byId = new Map(resolved.map((product) => [product.id, product]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

export const searchProductsTool = tool({
  description:
    "Search the store's products. Use semantic mode for vague, descriptive, or preference-driven " +
    "requests, and keyword mode for exact lookups or price-sorted browsing.",
  inputSchema: z.object({
    intent: z
      .string()
      .optional()
      .describe("What the shopper is trying to accomplish, for semantic mode."),
    mode: z.enum(["keyword", "semantic"]).default("semantic"),
    query: z.string(),
    sortKey: z
      .enum(["best-matches", "price-low-to-high", "price-high-to-low"])
      .default("best-matches")
      .describe("Only applies to keyword mode."),
  }),
  execute: async ({ intent, mode, query, sortKey }) => {
    const { user } = getAgentContext();

    try {
      if (mode === "semantic") {
        const products = await semanticProducts(query, intent, user.locale);
        if (products.length > 0) return { products: products.map(toAgentProduct) };
      }

      const { products } = await searchIndexProducts({
        limit: RESULT_LIMIT,
        locale: user.locale,
        query,
        sortKey,
      });
      return { products: products.map(toAgentProduct) };
    } catch (error) {
      console.error("Failed to search products:", error);
      return { error: "Product search is unavailable right now." };
    }
  },
});

export const getProductDetailsTool = tool({
  description:
    "Get full details for one product by handle, including description, variants, options, " +
    "pricing, and availability. Use this before adding a multi-variant product to the cart.",
  inputSchema: z.object({ handle: z.string() }),
  execute: async ({ handle }) => {
    const { user } = getAgentContext();

    try {
      const product = await getProductWithVariants({ handle, locale: user.locale });
      if (!product) return { error: `No product found for handle "${handle}".` };
      return { product: toAgentProductDetails(product) };
    } catch (error) {
      console.error("Failed to get product details:", error);
      return { error: "Product details are unavailable right now." };
    }
  },
});

export const getRecommendationsTool = tool({
  description: "Get complementary and related product recommendations for a product handle.",
  inputSchema: z.object({ handle: z.string() }),
  execute: async ({ handle }) => {
    const { user } = getAgentContext();

    try {
      const [complementary, related] = await Promise.all([
        getComplementaryProducts({ handle, locale: user.locale }),
        getRelatedProducts({ handle, locale: user.locale }),
      ]);
      const seen = new Set<string>();
      const products = [...complementary, ...related].filter((product) => {
        if (seen.has(product.handle)) return false;
        seen.add(product.handle);
        return true;
      });
      return { products: products.slice(0, RESULT_LIMIT).map(toAgentProduct) };
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      return { error: "Recommendations are unavailable right now." };
    }
  },
});
