import "server-only";
import { createPredictiveSearchServerHandlers, gql } from "@shopify/hydrogen";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { CollectionSearchState } from "@/lib/collections/server";
import { fetchSearchFacets, fetchSearchIndexProducts } from "@/lib/shopify/operations/products";
import type { Filter, PageInfo, PriceRange, ProductCard } from "@/lib/types";

export interface SearchResultsData {
  collection?: string;
  dataSearch: string;
  pageInfo: PageInfo;
  products: ProductCard[];
  query?: string;
  total: number;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}

export async function getSearchResultsData({
  collection,
  query,
  searchStatePromise,
}: {
  collection?: string;
  query?: string;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<SearchResultsData> {
  const { activeFilters, dataSearch, filters, sort } = await searchStatePromise;
  const [results, facets] = await Promise.all([
    fetchSearchIndexProducts({
      activeFilters,
      collection,
      filters,
      limit: PRODUCTS_PER_PAGE,
      query,
      sortKey: sort,
    }),
    fetchSearchFacets({
      activeFilters,
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
