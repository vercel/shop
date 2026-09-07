import { createPredictiveSearchServerHandlers, gql } from "@shopify/hydrogen";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import "server-only";

import type { CollectionSearchState } from "@/lib/collections/types";
import type { Locale } from "@/lib/i18n";
import {
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

import type { SearchResultsData } from "./types";

export async function getSearchResultsData({
  collection,
  locale,
  query,
  searchStatePromise,
}: {
  collection?: string;
  locale: Locale;
  query?: string;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<SearchResultsData> {
  const { activeFilters, dataSearch, filters, sort } = await searchStatePromise;
  const [results, facets] = await Promise.all([
    fetchSearchIndexProducts({
      activeFilters,
      collection,
      locale,
      filters,
      limit: PRODUCTS_PER_PAGE,
      query,
      sortKey: sort,
    }),
    fetchSearchFacets({
      activeFilters,
      collection,
      locale,
      filters,
      query,
    }),
  ]);
  return {
    collection,
    dataSearch,
    pageInfo: results.pageInfo,
    products: results.products,
    query,
    total: facets.total,
    transformedFilters: { filters: facets.filters, priceRange: facets.priceRange },
  };
}

const PRODUCT_FRAGMENT = gql(/* GraphQL */ `
  fragment PredictiveSearchProductFragment on Product {
    availableForSale
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      altText
      height
      url
      width
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    vendor
  }
`);

const COLLECTION_FRAGMENT = gql(/* GraphQL */ `
  fragment PredictiveSearchCollectionFragment on Collection {
    handle
    title
  }
`);

const QUERY_FRAGMENT = gql(/* GraphQL */ `
  fragment PredictiveSearchQueryFragment on SearchQuerySuggestion {
    styledText
    text
  }
`);

export const predictiveSearchHandlers = createPredictiveSearchServerHandlers({
  fragments: {
    collection: COLLECTION_FRAGMENT,
    product: PRODUCT_FRAGMENT,
    query: QUERY_FRAGMENT,
  },
  limit: 3,
  types: ["PRODUCT", "COLLECTION", "QUERY"],
});
