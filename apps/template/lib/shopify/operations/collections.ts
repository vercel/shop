import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Collection, CollectionWithThumbnail } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { COLLECTION_FIELDS_FRAGMENT } from "../fragments";
import { storefront } from "../storefront";
import {
  type ShopifyCollection,
  transformShopifyCollection,
  transformShopifyCollections,
} from "../transforms/collection";
import { getNumericShopifyId } from "../utils";

type CollectionsResponse = {
  collections: { edges: Array<{ node: ShopifyCollection }> };
};

type CollectionResponse = {
  collection: ShopifyCollection | null;
};

function tagCollections(collections: Array<{ handle: string }>): void {
  for (const collection of collections) {
    cacheTag(`collection-${collection.handle}`);
  }
}

const GET_COLLECTIONS_QUERY = `#graphql
  ${COLLECTION_FIELDS_FRAGMENT}
  query getCollections($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collections(first: $first) {
      edges {
        node {
          ...CollectionFields
        }
      }
    }
  }
` as const;

const GET_COLLECTION_QUERY = `#graphql
  ${COLLECTION_FIELDS_FRAGMENT}
  query getCollection($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...CollectionFields
    }
  }
` as const;

type ListingImage = { altText: string | null; height: number; url: string; width: number };

type CollectionsListingResponse = {
  collections: {
    edges: Array<{
      node: ShopifyCollection & {
        products: { edges: Array<{ node: { featuredImage: ListingImage | null; id: string } }> };
      };
    }>;
  };
};

const GET_COLLECTIONS_WITH_FEATURED_IMAGE_QUERY = `#graphql
  ${COLLECTION_FIELDS_FRAGMENT}
  query getCollectionsWithFeaturedImage($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collections(first: $first) {
      edges {
        node {
          ...CollectionFields
          products(first: 1) {
            edges {
              node {
                id
                featuredImage {
                  ...ImageFields
                }
              }
            }
          }
        }
      }
    }
  }
` as const;

export async function getCollections({
  limit = 250,
  locale = defaultLocale,
}: { limit?: number; locale?: string } = {}): Promise<Collection[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<CollectionsResponse>(GET_COLLECTIONS_QUERY, {
    variables: { first: limit, country, language },
  });
  assertStorefrontOk(response, "getCollections");
  const { data } = response;

  const rawCollections = data.collections.edges.map((edge) => edge.node);
  tagCollections(rawCollections);
  return transformShopifyCollections(rawCollections);
}

export async function getCollection({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<Collection | undefined> {
  // Plain "use cache" (not remote) so the resolved collection bakes into the
  // PLP static shell; "use cache: remote" defers to request time and won't inline.
  "use cache";
  cacheLife("max");
  cacheTag("collections", `collection-${handle}`);

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<CollectionResponse>(GET_COLLECTION_QUERY, {
    variables: { handle, country, language },
  });
  assertStorefrontOk(response, "getCollection");
  const { data } = response;

  if (!data.collection) return undefined;

  return transformShopifyCollection(data.collection);
}

export async function getCollectionsListing({
  limit = 250,
  locale = defaultLocale,
}: { limit?: number; locale?: string } = {}): Promise<CollectionWithThumbnail[]> {
  "use cache";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<CollectionsListingResponse>(
    GET_COLLECTIONS_WITH_FEATURED_IMAGE_QUERY,
    {
      variables: { country, first: limit, language },
    },
  );
  assertStorefrontOk(response, "getCollectionsListing");
  const { data } = response;

  const nodes = data.collections.edges.map((edge) => edge.node);

  // Per-collection and per-first-product tags so the listing busts on a collection edit
  // (collection-{handle}) or a fallback image change (product-{numericId}).
  tagCollections(nodes);
  for (const node of nodes) {
    const firstProductId = node.products.edges[0]?.node.id;
    const numericId = firstProductId ? getNumericShopifyId(firstProductId) : null;
    if (numericId) {
      cacheTag(`product-${numericId}`);
    }
  }

  return nodes.map((node) => {
    const raw = node.image ?? node.products.edges[0]?.node.featuredImage ?? null;
    return {
      ...transformShopifyCollection(node),
      thumbnail: raw
        ? { altText: raw.altText ?? node.title, height: raw.height, url: raw.url, width: raw.width }
        : null,
    };
  });
}
