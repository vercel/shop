"use server";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import { resolveBrowseParams } from "@/lib/collections/server";
import type { BrowseSource } from "@/lib/collections/types";
import type { ProductPage } from "@/lib/product/types";
import {
  fetchCollectionProducts,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

export async function loadMoreBrowseProductsAction({
  cursor,
  search,
  source,
}: {
  cursor: string;
  search: string;
  source: BrowseSource;
}): Promise<ProductPage> {
  const { filters, sort } = resolveBrowseParams(search);
  const page = { cursor, filters, limit: PRODUCTS_PER_PAGE, sortKey: sort };
  if (source.type === "search") {
    // Storefront `search` cursor is anchored to the original `first`; using a different page size returns count=0.
    return fetchSearchIndexProducts({
      ...page,
      collection: source.collection,
      query: source.query,
    });
  }
  const { pageInfo, products } = await fetchCollectionProducts({
    ...page,
    collection: source.collection,
  });
  return { pageInfo, products };
}
