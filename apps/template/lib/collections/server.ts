import { parseCollectionParams, serializeCollectionParams } from "@shopify/hydrogen";
import { getTranslations } from "next-intl/server";
import { cacheLife, cacheTag } from "next/cache";

import { getBrowseSort, PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { Collection, CollectionWithThumbnail } from "@/lib/collections/types";
import type { Locale } from "@/lib/i18n";
import { tagProducts } from "@/lib/product/server";
import {
  fetchCollection,
  fetchCollections,
  fetchCollectionsListing,
} from "@/lib/shopify/operations/collections/server";
import {
  fetchCollectionProducts,
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";
import type {
  CollectionProductsParams,
  CollectionProductsResult,
  SearchIndexProductsParams,
} from "@/lib/shopify/operations/products/types";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";

import type { CollectionResultsData, CollectionSearchState } from "./types";

// /collections/all is a local virtual collection with no Storefront API equivalent.
export const ALL_PRODUCTS_HANDLE = "all";

function tagCollections(collections: Array<{ handle: string }>): void {
  for (const collection of collections) {
    cacheTag(`collection-${collection.handle}`);
  }
}

export async function getCollections(
  params: { limit?: number; locale?: ShopifyLocale } = {},
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
  locale?: ShopifyLocale;
}): Promise<Collection | undefined> {
  // Plain cache is required to bake the collection into the PLP shell.
  "use cache";
  cacheLife("max");
  cacheTag("collections", `collection-${params.handle}`);

  return fetchCollection(params);
}

export async function getCollectionsListing(
  params: { limit?: number; locale?: ShopifyLocale } = {},
): Promise<CollectionWithThumbnail[]> {
  "use cache";
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

export function resolveBrowseParams(search: string | URLSearchParams): CollectionSearchState {
  const state = parseCollectionParams(
    typeof search === "string" ? new URLSearchParams(search) : search,
  );
  return {
    dataSearch: serializeCollectionParams(state).toString(),
    filters: state.filters,
    sort: getBrowseSort(state),
  };
}

export async function getCollectionSearchState(
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>,
): Promise<CollectionSearchState> {
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

// Only the initial page is cached: cursor pages drift apart and duplicate boundary products, so
// paginated browse requests stay live. `collection-results` invalidates the cached first pages together.
export async function getInitialCollectionProducts(
  params: Omit<CollectionProductsParams, "cursor">,
): Promise<CollectionProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collections", "collection-results", `collection-${params.collection}`);

  const result = await fetchCollectionProducts(params);
  tagProducts(result.products);
  return result;
}

export async function getInitialAllProducts(
  params: Omit<SearchIndexProductsParams, "collection" | "cursor" | "query">,
): Promise<CollectionProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collection-results");

  const [products, facets] = await Promise.all([
    fetchSearchIndexProducts(params),
    fetchSearchFacets({ filters: params.filters, locale: params.locale }),
  ]);
  tagProducts(products.products);
  return {
    filters: facets.filters,
    pageInfo: products.pageInfo,
    priceRange: facets.priceRange,
    products: products.products,
  };
}

export async function getCollectionResultsData({
  handle,
  locale,
  searchStatePromise,
}: {
  handle: string;
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<CollectionResultsData> {
  const { dataSearch, filters, sort } = await searchStatePromise;
  const result = await getInitialCollectionProducts({
    collection: handle,
    sortKey: sort,
    limit: PRODUCTS_PER_PAGE,
    filters,
    locale,
  });

  return {
    collection: handle,
    dataSearch,
    sort,
    filters,
    result,
    transformedFilters: { filters: result.filters, priceRange: result.priceRange },
  };
}

export async function getAllProductsCollection(): Promise<Collection> {
  const t = await getTranslations("collections.all");
  const title = t("title");
  const description = t("description");
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

export async function getAllProductsResultsData({
  locale,
  searchStatePromise,
}: {
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<CollectionResultsData> {
  const { dataSearch, filters, sort } = await searchStatePromise;
  const result = await getInitialAllProducts({
    sortKey: sort,
    limit: PRODUCTS_PER_PAGE,
    filters,
    locale,
  });
  return {
    collection: ALL_PRODUCTS_HANDLE,
    dataSearch,
    sort,
    filters,
    result,
    transformedFilters: { filters: result.filters, priceRange: result.priceRange },
  };
}
