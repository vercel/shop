import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Collection } from "@/lib/types";

import { shopifyFetch } from "../fetch";
import { COLLECTION_FIELDS_FRAGMENT } from "../fragments";
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

const GET_COLLECTIONS_QUERY = `
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
`;

const GET_COLLECTION_QUERY = `
  ${COLLECTION_FIELDS_FRAGMENT}
  query getCollection($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...CollectionFields
    }
  }
`;

export async function getCollections({
  limit = 250,
  locale = defaultLocale,
}: { limit?: number; locale?: string } = {}): Promise<Collection[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections");

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<CollectionsResponse>({
    operation: "getCollections",
    query: GET_COLLECTIONS_QUERY,
    variables: { first: limit, country, language },
  });

  const rawCollections = data.collections.edges.map((edge) => edge.node);
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

  const data = await shopifyFetch<CollectionResponse>({
    operation: "getCollection",
    query: GET_COLLECTION_QUERY,
    variables: { handle, country, language },
  });

  if (!data.collection) return undefined;

  return transformShopifyCollection(data.collection);
}
