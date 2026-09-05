"use server";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import { resolveBrowseParams } from "@/lib/collections/server";
import { fetchCollectionProducts } from "@/lib/shopify/operations/products";
import type { PageInfo, ProductCard } from "@/lib/types";

export async function loadMoreCollectionProductsAction(params: {
  collection: string;
  cursor: string;
  search: string;
}): Promise<{ products: ProductCard[]; pageInfo: PageInfo }> {
  const { activeFilters, filters, sort } = resolveBrowseParams(params.search);
  const result = await fetchCollectionProducts({
    activeFilters,
    collection: params.collection,
    cursor: params.cursor,
    sortKey: sort,
    limit: PRODUCTS_PER_PAGE,
    filters,
  });
  return {
    products: result.products,
    pageInfo: result.pageInfo,
  };
}
