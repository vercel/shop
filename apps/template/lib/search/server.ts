import { createPredictiveSearchServerHandlers, gql } from "@shopify/hydrogen";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { CollectionSearchState } from "@/lib/collections/types";
import {
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

import type { SearchResultsData } from "./types";

export async function getSearchResultsData({
  collection,
  query,
  searchStatePromise,
}: {
  collection?: string;
  query?: string;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<SearchResultsData> {
  const { dataSearch, filters, sort } = await searchStatePromise;
  const [results, facets] = await Promise.all([
    fetchSearchIndexProducts({
      collection,
      filters,
      limit: PRODUCTS_PER_PAGE,
      query,
      sortKey: sort,
    }),
    fetchSearchFacets({
      collection,
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
    product: PRODUCT_FRAGMENT,
    query: QUERY_FRAGMENT,
  },
  limit: 3,
  types: ["PRODUCT", "QUERY"],
});
