"use server";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import { resolveBrowseParams } from "@/lib/collections/server";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard } from "@/lib/product/types";
import { fetchSearchIndexProducts } from "@/lib/shopify/operations/products/server";

export async function loadMoreSearchProductsAction(params: {
  collection?: string;
  cursor: string;
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
    limit: PRODUCTS_PER_PAGE,
  });
  return {
    products: result.products,
    pageInfo: result.pageInfo,
  };
}
