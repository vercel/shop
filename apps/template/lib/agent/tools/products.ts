import { tool } from "ai";
import { z } from "zod";

import {
  getComplementaryProducts,
  getProductOptionValues,
  getProductsByIds,
  getProductWithVariants,
  getRelatedProducts,
  searchIndexProducts,
} from "@/lib/shopify/operations/products";
import { searchCatalog } from "@/lib/shopify/storefront";
import type { ProductCard } from "@/lib/types";

import { toAgentProduct, toAgentProductDetails } from "../products";

const RESULT_LIMIT = 6;
// Shopify pads results to the requested count, so constrained searches scan a wider pool
// and keep only genuine matches.
const CONSTRAINED_POOL = 50;

type ProductOption = { name: string; value: string };

/**
 * Strips option words from the query text. Option values are enforced structurally against
 * each product's real options, and leaving them in the query pulls in every garment sharing
 * that colour ("orange jackets" also matches orange hoodies and tees).
 */
function queryWithoutOptions(query: string, options: ProductOption[]): string {
  let stripped = query;
  for (const option of options) {
    const escaped = option.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    stripped = stripped.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  }
  const cleaned = stripped.replace(/\s+/g, " ").trim();
  return cleaned || query;
}

// Shopify's semantic catalog search returns GIDs only, so canonical fields always come
// from the Storefront API; a semantic miss falls back to the keyword index.
async function semanticProducts(query: string, intent: string | undefined, limit: number) {
  const { products = [] } = await searchCatalog({
    intent,
    limit,
    query,
  });
  const ids = products.map((product) => product.id);
  if (ids.length === 0) return [];
  const resolved = await getProductsByIds({
    ids,
  });
  const byId = new Map(resolved.map((product) => [product.id, product]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

/**
 * Keeps only products that genuinely carry every stated option. `productFilters` can't do
 * this — it narrows facet counts, not results — so an empty result must stay empty rather
 * than fall back to the unfiltered list the shopper didn't ask for.
 */
async function keepMatching(
  products: ProductCard[],
  options: ProductOption[],
): Promise<ProductCard[]> {
  if (options.length === 0 || products.length === 0) return products;

  const optionValues = await getProductOptionValues({
    ids: products.map((product) => product.id),
  });

  return products.filter((product) => {
    const available = optionValues.get(product.handle);
    if (!available) return false;
    return options.every((option) =>
      available.get(option.name.toLowerCase())?.has(option.value.toLowerCase()),
    );
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
    options: z
      .array(z.object({ name: z.string(), value: z.string() }))
      .default([])
      .describe(
        'Hard product-option constraints the shopper stated, e.g. [{"name":"Color","value":"Orange"}]. ' +
          "Results that lack every listed option are dropped, so only pass options the shopper actually required.",
      ),
    query: z.string(),
    sortKey: z
      .enum(["best-matches", "price-low-to-high", "price-high-to-low"])
      .default("best-matches")
      .describe("Only applies to keyword mode."),
  }),
  execute: async ({ intent, mode, options, query, sortKey }) => {
    const constrained = options.length > 0;
    const searchQuery = queryWithoutOptions(query, options);
    const poolSize = constrained ? CONSTRAINED_POOL : RESULT_LIMIT;
    try {
      let pool: ProductCard[] = [];
      if (mode === "semantic") {
        pool = await semanticProducts(searchQuery, intent, poolSize);
      }
      if (pool.length === 0) {
        const { products } = await searchIndexProducts({
          limit: poolSize,
          query: searchQuery,
          sortKey,
        });
        pool = products;
      }
      const matching = await keepMatching(pool, options);
      if (constrained && matching.length === 0) {
        return {
          products: [],
          unmatchedOptions: options,
        };
      }
      return { products: matching.slice(0, RESULT_LIMIT).map(toAgentProduct) };
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
    try {
      const product = await getProductWithVariants({
        handle,
      });
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
    try {
      const [complementary, related] = await Promise.all([
        getComplementaryProducts({
          handle,
        }),
        getRelatedProducts({
          handle,
        }),
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
