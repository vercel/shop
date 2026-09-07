"use server";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import { resolveBrowseParams } from "@/lib/collections/server";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard } from "@/lib/product/types";
import { fetchCollectionProducts } from "@/lib/shopify/operations/products/server";

export async function loadMoreCollectionProductsAction(params: {
  collection: string;
  cursor: string;
  locale: string;
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
    locale: params.locale,
  });

  return {
    products: result.products,
    pageInfo: result.pageInfo,
  };
}
