// Next-free collections fetch core: storefront.request + transform, no "next/cache".
// The cached wrapper in ./collections.ts adds "use cache" + cacheTag around this;
// eve agent tools import this directly.
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Collection } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { COLLECTION_FIELDS_FRAGMENT } from "../fragments";
import { storefront } from "../storefront.core";
import { type ShopifyCollection, transformShopifyCollections } from "../transforms/collection";

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

export async function fetchCollections({
  limit = 250,
  locale = defaultLocale,
}: { limit?: number; locale?: string } = {}): Promise<Collection[]> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{
    collections: { edges: Array<{ node: ShopifyCollection }> };
  }>(GET_COLLECTIONS_QUERY, {
    variables: { first: limit, country, language },
  });
  assertStorefrontOk(response, "getCollections");

  return transformShopifyCollections(response.data.collections.edges.map((edge) => edge.node));
}
