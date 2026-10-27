import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { describeCollection, PRODUCTS_PER_PAGE, resolveBrowseParams } from "@/lib/collections";
import type {
  BrowseResults,
  BrowseState,
  Collection,
  CollectionWithThumbnail,
} from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { tagProducts } from "@/lib/product/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getNumericShopifyId } from "@/lib/shopify/id/server";
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

// /collections/all is a local virtual collection with no Storefront API equivalent.
export const ALL_PRODUCTS_HANDLE = "all";

// Delete payloads carry only the ID and renames only the new handle, so cached reads carry both tags.
function tagCollections(collections: Array<{ handle: string; id?: string }>): void {
  for (const collection of collections) {
    cacheTag(`collection-${collection.handle}`);
    const numericId = collection.id ? getNumericShopifyId(collection.id) : null;
    if (numericId) cacheTag(`collection-${numericId}`);
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

  const collection = await fetchCollection(params);
  if (collection) tagCollections([collection]);
  return collection;
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

// The default view, unfiltered and in its default sort: Search & Discovery edits send no webhook, so they appear once a product or collection webhook refreshes it, and Load more's product dedupe absorbs cursor drift.
export async function getCollectionResults(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<BrowseResults> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", `collection-${params.handle}`, "products-index");

  const { facets, pageInfo, products } = await fetchCollectionProducts({
    collection: params.handle,
    limit: PRODUCTS_PER_PAGE,
    locale: params.locale,
  });
  tagProducts(products);
  return {
    dataSearch: "",
    facets,
    pageInfo,
    products,
    source: { collection: params.handle, type: "collection" },
  };
}

export async function getAllProductsResults(
  params: { locale?: CommerceLocale } = {},
): Promise<BrowseResults> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products-index");

  const [{ pageInfo, products }, { facets, total }] = await Promise.all([
    fetchSearchIndexProducts({ limit: PRODUCTS_PER_PAGE, locale: params.locale }),
    fetchSearchFacets({ locale: params.locale }),
  ]);
  tagProducts(products);
  return { dataSearch: "", facets, pageInfo, products, source: { type: "search" }, total };
}

// Filtered and sorted views stay live; a cache entry per combination would rarely be reused.
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
    seo: {
      description: `Browse every product at ${shopConfig.site.name}: compare prices and check availability.`,
      title,
    },
  };
}

function browseMetadata(handle: string, title: string, description: string): Metadata {
  const url = `/collections/${handle}`;
  return {
    title,
    description,
    alternates: buildAlternates({ pathname: url }),
    openGraph: buildOpenGraph({ title, description, url, type: "website" }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export async function getCollectionMetadata(handle: string): Promise<Metadata> {
  const collection = await getCollection({ handle });
  if (!collection) return browseMetadata(handle, "Collection", "Browse collection products.");
  return browseMetadata(collection.handle, collection.seo.title, describeCollection(collection));
}

export async function getAllProductsMetadata(): Promise<Metadata> {
  return browseMetadata(
    ALL_PRODUCTS_HANDLE,
    "Products",
    describeCollection(await getAllProductsCollection()),
  );
}
