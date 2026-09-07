import { flattenConnection, gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { COLLECTION_FIELDS_FRAGMENT } from "@/lib/shopify/fragments/collection";
import { getNumericShopifyId } from "@/lib/shopify/id/server";
import { storefront } from "@/lib/shopify/storefront/server";
import {
  transformShopifyCollection,
  transformShopifyCollections,
} from "@/lib/shopify/transforms/collection";
import type { Collection, CollectionWithThumbnail } from "@/lib/types";

function tagCollections(collections: Array<{ handle: string }>): void {
  for (const collection of collections) {
    cacheTag(`collection-${collection.handle}`);
  }
}

const GET_COLLECTION_QUERY = gql(
  `#graphql
  query getCollection($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...CollectionFields
    }
  }
`,
  [COLLECTION_FIELDS_FRAGMENT],
);

const GET_COLLECTIONS_WITH_FEATURED_IMAGE_QUERY = gql(
  `#graphql
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
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  }
`,
  [COLLECTION_FIELDS_FRAGMENT],
);

export async function getCollections(
  params: {
    limit?: number;
    locale?: CommerceLocale;
  } = {},
): Promise<Collection[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const collections = await fetchCollections(params);
  tagCollections(collections);
  return collections;
}

export async function getCollection({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<Collection | undefined> {
  // Plain cache is required to bake the collection into the PLP shell.
  "use cache";
  cacheLife("max");
  cacheTag("collections", `collection-${handle}`);

  const response = await storefront.request(GET_COLLECTION_QUERY, {
    locale,
    variables: { handle },
  });
  assertStorefrontOk(response, "getCollection");
  const { data } = response;

  if (!data.collection) return undefined;

  return transformShopifyCollection(data.collection);
}

export async function getCollectionsListing({
  limit = 250,
  locale = shopConfig.localization,
}: {
  limit?: number;
  locale?: CommerceLocale;
} = {}): Promise<CollectionWithThumbnail[]> {
  "use cache";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const response = await storefront.request(GET_COLLECTIONS_WITH_FEATURED_IMAGE_QUERY, {
    locale,
    variables: { first: limit },
  });
  assertStorefrontOk(response, "getCollectionsListing");
  const { data } = response;

  const nodes = flattenConnection(data.collections);

  // The first product tag covers collection thumbnails that fall back to product imagery.
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
        ? {
            altText: raw.altText ?? node.title,
            height: raw.height ?? 0,
            url: raw.url,
            width: raw.width ?? 0,
          }
        : null,
    };
  });
}
const GET_COLLECTIONS_QUERY = gql(
  `#graphql
  query getCollections($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collections(first: $first) {
      edges {
        node {
          ...CollectionFields
        }
      }
    }
  }
`,
  [COLLECTION_FIELDS_FRAGMENT],
);
export async function fetchCollections({
  limit = 250,
  locale = shopConfig.localization,
}: {
  limit?: number;
  locale?: CommerceLocale;
} = {}): Promise<Collection[]> {
  const response = await storefront.request(GET_COLLECTIONS_QUERY, {
    locale,
    variables: { first: limit },
  });
  assertStorefrontOk(response, "getCollections");

  return transformShopifyCollections(flattenConnection(response.data.collections));
}
