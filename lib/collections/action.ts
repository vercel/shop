"use server";

import { z } from "zod";

import { PRODUCTS_PER_PAGE, resolveBrowseParams } from "@/lib/collections";
import type { BrowseSource } from "@/lib/collections/types";
import type { ProductPage } from "@/lib/product/types";
import {
  fetchCollectionProducts,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

const LOAD_MORE_INPUT = z.strictObject({
  cursor: z.string().min(1),
  search: z.string(),
  source: z.discriminatedUnion("type", [
    z.strictObject({ collection: z.string().min(1), type: z.literal("collection") }),
    z.strictObject({ query: z.string().optional(), type: z.literal("search") }),
  ]) satisfies z.ZodType<BrowseSource>,
});

const EMPTY_PAGE: ProductPage = {
  pageInfo: { endCursor: null, hasNextPage: false, hasPreviousPage: false, startCursor: null },
  products: [],
};

export async function loadMoreBrowseProductsAction(input: {
  cursor: string;
  search: string;
  source: BrowseSource;
}): Promise<ProductPage> {
  const parsed = LOAD_MORE_INPUT.safeParse(input);
  if (!parsed.success) return EMPTY_PAGE;
  const { cursor, search, source } = parsed.data;

  const { filters, sort } = resolveBrowseParams(search);
  const page = { cursor, filters, limit: PRODUCTS_PER_PAGE, sortKey: sort };
  if (source.type === "search") {
    // Storefront `search` cursor is anchored to the original `first`; using a different page size returns count=0.
    return fetchSearchIndexProducts({ ...page, query: source.query });
  }
  const { pageInfo, products } = await fetchCollectionProducts({
    ...page,
    collection: source.collection,
  });
  return { pageInfo, products };
}
