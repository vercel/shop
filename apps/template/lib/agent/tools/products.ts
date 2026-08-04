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

/**
 * Shopify ranks matches first but always pads results out to the requested limit, and
 * `productFilters` only narrows facet counts rather than results, so a hard constraint
 * like "orange" has to be enforced here or the grid shows six items for two matches.
 */
async function keepMatching(
  products: ProductCard[],
  options: Array<{ name: string; value: string }>,
): Promise<ProductCard[]> {
  if (options.length === 0 || products.length === 0) return products;

  const optionValues = await getProductOptionValues({
    ids: products.map((product) => product.id),
  });

  const matches = products.filter((product) => {
    const available = optionValues.get(product.handle);
    if (!available) return false;
    return options.every((option) =>
      available.get(option.name.toLowerCase())?.has(option.value.toLowerCase()),
    );
  });

  // A constraint Shopify's index doesn't model as an option shouldn't blank the results.
  return matches.length > 0 ? matches : products;
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
    const { user } = getAgentContext();

    try {
      if (mode === "semantic") {
        const products = await semanticProducts(query, intent, user.locale);
        if (products.length > 0) {
          const matching = await keepMatching(products, options);
          return { products: matching.map(toAgentProduct) };
        }
      }

      const { products } = await searchIndexProducts({
        limit: RESULT_LIMIT,
        locale: user.locale,
        query,
        sortKey,
      });
      const matching = await keepMatching(products, options);
      return { products: matching.map(toAgentProduct) };
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
