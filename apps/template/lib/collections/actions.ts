"use server";

import { getCollectionProducts, getProducts } from "@/lib/shopify/operations/products";
import type { PageInfo, ProductCard } from "@/lib/types";

export async function loadMoreCollectionProducts(params: {
  collection: string;
  cursor: string;
  sortKey?: string;
  filtersJson?: string;
  locale: string;
}): Promise<{ products: ProductCard[]; pageInfo: PageInfo }> {
  const result = await getCollectionProducts({
    collection: params.collection,
    cursor: params.cursor,
    sortKey: params.sortKey,
    filtersJson: params.filtersJson,
    locale: params.locale,
  });

  return {
    products: result.products,
    pageInfo: result.pageInfo,
  };
}

export async function loadMoreSearchProducts(params: {
  query?: string;
  collection?: string;
  cursor: string;
  sortKey?: string;
  filtersJson?: string;
  locale: string;
}): Promise<{ products: ProductCard[]; pageInfo: PageInfo; total: number }> {
  const result = await getProducts({
    query: params.query,
    collection: params.collection,
    cursor: params.cursor,
    sortKey: params.sortKey,
    filtersJson: params.filtersJson,
    locale: params.locale,
  });

  return {
    products: result.products,
    pageInfo: result.pageInfo,
    total: result.total,
  };
}
