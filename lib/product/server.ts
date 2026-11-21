import type { ProductRecommendationIntent } from "@shopify/hydrogen/storefront-api-types";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommerceLocale } from "@/lib/config/types";
import type { ProductCard, ProductDetails, ProductPage } from "@/lib/product/types";
import { getNumericShopifyId } from "@/lib/shopify/id/server";
import {
  fetchProduct,
  fetchProductRecommendations,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";
import type { SearchIndexProductsParams } from "@/lib/shopify/operations/products/types";

// Only valid inside a cache directive scope.
export function tagProducts(products: Array<{ id: string }>): void {
  for (const product of products) {
    const numericId = getNumericShopifyId(product.id);
    if (numericId) cacheTag(CACHE_TAGS.product(numericId));
  }
}

export async function getProduct(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.product(params.handle));

  const product = await fetchProduct(params);
  if (product) tagProducts([product]);
  return product;
}

// Cursor-paginated browse reads stay uncached in lib/collections/server.ts; this serves fixed grids only.
export async function getSearchIndexProducts(
  params: SearchIndexProductsParams,
): Promise<ProductPage> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.productsIndex);

  const result = await fetchSearchIndexProducts(params);
  tagProducts(result.products);
  return result;
}

export async function getProductRecommendations(params: {
  handle: string;
  intent: ProductRecommendationIntent;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.recommendations(params.handle));

  const products = await fetchProductRecommendations(params);
  tagProducts(products);
  return products;
}
