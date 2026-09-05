"use server";

import { resolveBrowseParams } from "@/lib/collections/server";
import { fetchSearchIndexProducts } from "@/lib/shopify/operations/products";
import type { PageInfo, ProductCard } from "@/lib/types";
import { RESULTS_PER_PAGE } from "@/lib/utils";

export async function loadMoreSearchProductsAction(params: {
  collection?: string;
  cursor: string;
  locale: string;
  query?: string;
  search: string;
}): Promise<{ products: ProductCard[]; pageInfo: PageInfo }> {
  const { activeFilters, filters, sort } = resolveBrowseParams(params.search);
  // Storefront `search` cursor is anchored to the original `first`; using a different page size returns count=0.
  const result = await fetchSearchIndexProducts({
    activeFilters,
    query: params.query,
    collection: params.collection,
    cursor: params.cursor,
    sortKey: sort,
    filters,
    limit: RESULTS_PER_PAGE,
    locale: params.locale,
  });

  return {
    products: result.products,
    pageInfo: result.pageInfo,
  };
}
