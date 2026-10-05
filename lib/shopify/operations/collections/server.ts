import { flattenConnection, gql } from "@shopify/hydrogen";

import type { Collection, CollectionWithThumbnail } from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { COLLECTION_FIELDS_FRAGMENT } from "@/lib/shopify/fragments/collection";
import { storefront } from "@/lib/shopify/storefront/server";
import {
  transformShopifyCollection,
  transformShopifyCollections,
} from "@/lib/shopify/transforms/collection";

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

export async function fetchCollection({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<Collection | undefined> {
  const response = await storefront.request(GET_COLLECTION_QUERY, {
    locale,
    variables: { handle },
  });
  assertStorefrontOk(response, "getCollection");
  const { data } = response;

  if (!data.collection) return undefined;
  return transformShopifyCollection(data.collection);
}

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

export async function fetchCollectionsListing({
  limit = 250,
  locale = shopConfig.localization,
}: {
  limit?: number;
  locale?: CommerceLocale;
} = {}): Promise<CollectionWithThumbnail[]> {
  const response = await storefront.request(GET_COLLECTIONS_WITH_FEATURED_IMAGE_QUERY, {
    locale,
    variables: { first: limit },
  });
  assertStorefrontOk(response, "getCollectionsListing");
  const { data } = response;

  return flattenConnection(data.collections).map((node) => {
    const firstProduct = node.products.edges[0]?.node;
    const raw = node.image ?? firstProduct?.featuredImage ?? null;
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
      thumbnailProductId: firstProduct?.id ?? null,
    };
  });
}
