"use server";

import { fetchSearchIndexProducts } from "@/lib/shopify/operations/products";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { PageInfo, ProductCard } from "@/lib/types";
import { RESULTS_PER_PAGE } from "@/lib/utils";

export async function loadMoreSearchProducts(params: {
  activeFilters?: Record<string, string | string[] | undefined>;
  collection?: string;
  cursor: string;
  query?: string;
  sortKey?: string;
  filters?: ProductFilter[];
  locale: string;
}): Promise<{ products: ProductCard[]; pageInfo: PageInfo }> {
  // Storefront `search` cursor is anchored to the original `first`; using a different page size returns count=0.
  const result = await fetchSearchIndexProducts({
    activeFilters: params.activeFilters,
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
