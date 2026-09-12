import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import type {
  ProductCard,
  ProductDetails,
  ProductVariant,
  SelectedOption,
} from "@/lib/product/types";
import { getNumericShopifyId } from "@/lib/shopify/id/server";
import {
  fetchComplementaryProducts,
  fetchProduct,
  fetchProductOptionValues,
  fetchProducts,
  fetchProductsByIds,
  fetchProductVariant,
  fetchProductWithVariants,
  fetchRelatedProducts,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";
import type {
  ProductOptionValues,
  ProductsParams,
  ProductsResult,
  SearchIndexProductsParams,
  SearchIndexProductsResult,
} from "@/lib/shopify/operations/products/types";

// Only valid inside a "use cache" scope.
export function tagProducts(products: Array<{ id: string }>): void {
  for (const product of products) {
    const numericId = getNumericShopifyId(product.id);
    if (numericId) cacheTag(`product-${numericId}`);
  }
}

export async function getProduct(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${params.handle}`);

  const product = await fetchProduct(params);
  if (product) tagProducts([product]);
  return product;
}

export async function getProductVariant(params: {
  handle: string;
  locale?: CommerceLocale;
  selectedOptions: SelectedOption[];
}): Promise<ProductVariant | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${params.handle}`);

  return fetchProductVariant(params);
}

export async function getProductWithVariants(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${params.handle}`);

  const product = await fetchProductWithVariants(params);
  if (product) tagProducts([product]);
  return product;
}

export async function getProducts(params: ProductsParams): Promise<ProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const result = await fetchProducts(params);
  tagProducts(result.products);
  return result;
}

export async function getProductOptionValues(params: {
  ids: string[];
}): Promise<ProductOptionValues> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  return fetchProductOptionValues(params.ids);
}

// Cursor-paginated browse reads stay uncached in lib/collections/server.ts; this serves fixed grids only.
export async function getSearchIndexProducts(
  params: SearchIndexProductsParams,
): Promise<SearchIndexProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const result = await fetchSearchIndexProducts(params);
  tagProducts(result.products);
  return result;
}

export async function getComplementaryProducts(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${params.handle}`);

  const products = await fetchComplementaryProducts(params);
  tagProducts(products);
  return products;
}

export async function getRelatedProducts(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${params.handle}`);

  const products = await fetchRelatedProducts(params);
  tagProducts(products);
  return products;
}

export async function getProductsByIds(params: {
  ids: string[];
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const products = await fetchProductsByIds(params);
  tagProducts(products);
  return products;
}
