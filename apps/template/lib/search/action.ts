"use server";

import { searchIndexProducts } from "@/lib/shopify/operations/products";
import { predictiveSearch } from "@/lib/shopify/operations/search";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { PageInfo, PredictiveSearchResult, ProductCard } from "@/lib/types";
import { RESULTS_PER_PAGE } from "@/lib/utils";

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
  // Storefront `search` cursor is anchored to the original `first`; using a different page size returns count=0.
  const result = await searchIndexProducts({
    query: params.query,
    collection: params.collection,
    cursor: params.cursor,
    sortKey: params.sortKey,
    filters: params.filters,
    limit: RESULTS_PER_PAGE,
    locale: params.locale,
  });

  return {
    products: result.products,
    pageInfo: result.pageInfo,
  };
}
