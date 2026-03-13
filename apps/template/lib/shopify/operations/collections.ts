import { cacheLife, cacheTag } from "next/cache";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Collection } from "@/lib/types";
import { shopifyFetch } from "../client";
import {
  type ShopifyCollection,
  transformShopifyCollection,
  transformShopifyCollections,
} from "../transforms/collection";

type CollectionsResponse = {
  collections: { edges: Array<{ node: ShopifyCollection }> };
};

type CollectionResponse = {
  collection: ShopifyCollection | null;
};

export async function getCollections(
  locale: string = defaultLocale,
): Promise<Collection[]> {
  "use cache: remote";
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
    variables: { first: 250, country, language },
  });

  const rawCollections = data.collections.edges.map((edge) => edge.node);
  return transformShopifyCollections(rawCollections);
}

export async function getCollection(
  handle: string,
  locale: string = defaultLocale,
): Promise<Collection | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", `collection-${handle}`);

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
