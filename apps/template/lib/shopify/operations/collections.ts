import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Collection } from "@/lib/types";

import { shopifyFetch } from "../fetch";
import {
  type ShopifyCollection,
  transformShopifyCollection,
  transformShopifyCollections,
} from "../transforms/collection";

// Shopify's `/collections/all` is a Liquid-storefront convention with no equivalent in the
// Storefront API — `collection(handle: "all")` always returns null, so we synthesize it.
export const ALL_PRODUCTS_HANDLE = "all";

function synthesizeAllProductsCollection(): Collection {
  return {
    handle: ALL_PRODUCTS_HANDLE,
    title: "All Products",
    description: "",
    image: null,
    path: `/collections/${ALL_PRODUCTS_HANDLE}`,
    updatedAt: new Date(0).toISOString(),
    seo: {
      title: "All Products",
      description: "",
    },
  };
}

type CollectionsResponse = {
  collections: { edges: Array<{ node: ShopifyCollection }> };
};

type CollectionResponse = {
  collection: ShopifyCollection | null;
};

export async function getCollections({
  limit = 250,
  locale = defaultLocale,
}: { limit?: number; locale?: string } = {}): Promise<Collection[]> {
  "use cache";
  cacheLife("max");
  cacheTag("collections");

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<CollectionsResponse>({
    operation: "getCollections",
    query: `
      query getCollections($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
        collections(first: $first) {
          edges {
            node {
              handle
              title
              description
              image {
                url
                altText
                width
                height
              }
              updatedAt
              seo {
                title
                description
              }
            }
          }
        }
      }
    `,
    variables: { first: limit, country, language },
  });

  const rawCollections = data.collections.edges.map((edge) => edge.node);
  return transformShopifyCollections(rawCollections);
}

export async function getCollection(
  handle: string,
  locale: string = defaultLocale,
): Promise<Collection | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("collections", `collection-${handle}`);

  if (handle === ALL_PRODUCTS_HANDLE) {
    return synthesizeAllProductsCollection();
  }

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<CollectionResponse>({
    operation: "getCollection",
    query: `
      query getCollection($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
        collection(handle: $handle) {
          handle
          title
          description
          image {
            url
            altText
            width
            height
          }
          updatedAt
          seo {
            title
            description
          }
        }
      }
    `,
    variables: { handle, country, language },
  });

  if (!data.collection) return undefined;

  return transformShopifyCollection(data.collection);
}
