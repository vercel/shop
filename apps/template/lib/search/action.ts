"use server";

import { getSearchProducts } from "@/lib/shopify/operations/products";
import { predictiveSearch } from "@/lib/shopify/operations/search";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { PageInfo, PredictiveSearchResult, ProductCard } from "@/lib/types";

export async function predictiveSearchAction(
  query: string,
  locale: string,
): Promise<PredictiveSearchResult> {
  if (!query.trim()) {
    return { products: [], collections: [], queries: [] };
  }

  return predictiveSearch(query.trim(), locale, 4);
}

export async function loadMoreSearchProducts(params: {
  query?: string;
  collection?: string;
  cursor: string;
  sortKey?: string;
  filters?: ProductFilter[];
  locale: string;
}): Promise<{ products: ProductCard[]; pageInfo: PageInfo }> {
  const result = await getSearchProducts({
    query: params.query,
    collection: params.collection,
    cursor: params.cursor,
    sortKey: params.sortKey,
    filters: params.filters,
    locale: params.locale,
  });

  return {
    products: result.products,
    pageInfo: result.pageInfo,
  };
}
