import { parseCollectionParams, serializeCollectionParams } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { getBrowseSort, PRODUCTS_PER_PAGE } from "@/lib/collections";
import type {
  BrowseResults,
  BrowseState,
  Collection,
  CollectionWithThumbnail,
} from "@/lib/collections/types";
import type { CommerceLocale } from "@/lib/config/types";
import { tagProducts } from "@/lib/product/server";
import {
  fetchCollection,
  fetchCollections,
  fetchCollectionsListing,
} from "@/lib/shopify/operations/collections/server";
import { fetchCollectionProducts } from "@/lib/shopify/operations/products/server";

// /collections/all is a local virtual collection with no Storefront API equivalent.
export const ALL_PRODUCTS_HANDLE = "all";

function tagCollections(collections: Array<{ handle: string }>): void {
  for (const collection of collections) {
    cacheTag(`collection-${collection.handle}`);
  }
}

export async function getCollections(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<Collection[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const collections = await fetchCollections(params);
  tagCollections(collections);
  return collections;
}

export async function getCollection(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<Collection | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", `collection-${params.handle}`);

  return fetchCollection(params);
}

export async function getCollectionsListing(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<CollectionWithThumbnail[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const collections = await fetchCollectionsListing(params);
  tagCollections(collections);
  // Thumbnails fall back to product imagery, so product updates must refresh the listing.
  tagProducts(
    collections.flatMap((collection) =>
      collection.thumbnailProductId ? [{ id: collection.thumbnailProductId }] : [],
    ),
  );
  return collections;
}

export function resolveBrowseParams(search: string | URLSearchParams): BrowseState {
  const state = parseCollectionParams(
    typeof search === "string" ? new URLSearchParams(search) : search,
  );
  return {
    dataSearch: serializeCollectionParams(state).toString(),
    filters: state.filters,
    sort: getBrowseSort(state),
  };
}

export async function readBrowseState(
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>,
): Promise<BrowseState> {
  return resolveBrowseParams(recordToSearchParams(await searchParamsPromise));
}

function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

// Browse pages and facets stay uncached: cached cursor pages drift apart and duplicate boundary products, and Search & Discovery changes must appear immediately.
export async function fetchCollectionResults({
  handle,
  statePromise,
}: {
  handle: string;
  statePromise: Promise<BrowseState>;
}): Promise<BrowseResults> {
  const { dataSearch, filters, sort } = await statePromise;
  const { facets, pageInfo, products } = await fetchCollectionProducts({
    collection: handle,
    filters,
    limit: PRODUCTS_PER_PAGE,
    sortKey: sort,
  });
  return {
    dataSearch,
    facets,
    pageInfo,
    products,
    source: { collection: handle, type: "collection" },
  };
}

export async function getAllProductsCollection(): Promise<Collection> {
  const title = "Products";
  const description = "";
  return {
    handle: ALL_PRODUCTS_HANDLE,
    title,
    description,
    image: null,
    path: `/collections/${ALL_PRODUCTS_HANDLE}`,
    updatedAt: new Date(0).toISOString(),
    seo: { title, description },
  };
}
