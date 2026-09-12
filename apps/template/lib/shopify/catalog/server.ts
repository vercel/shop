import { flattenConnection, gql } from "@shopify/hydrogen";
import type {
  ProductCollectionSortKeys,
  SearchSortKeys,
} from "@shopify/hydrogen/storefront-api-types";

import type { Collection } from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type { ProductCard, ProductDetails } from "@/lib/product/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { COLLECTION_FIELDS_FRAGMENT } from "@/lib/shopify/fragments/collection";
import { FILTER_FRAGMENT } from "@/lib/shopify/fragments/filters";
import {
  FILTERABLE_PRODUCT_CARD_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_WITH_VARIANTS_FRAGMENT,
} from "@/lib/shopify/fragments/product";
import { decodeShopifyId } from "@/lib/shopify/id/server";
import type {
  CollectionProductsParams,
  CollectionProductsResult,
  ProductOptionValues,
  SearchIndexProductsParams,
  SearchIndexProductsResult,
} from "@/lib/shopify/operations/products/types";
import { storefront } from "@/lib/shopify/storefront/server";
import { transformShopifyCollections } from "@/lib/shopify/transforms/collection";
import {
  getSelectedColorFilterLabel,
  transformShopifyFilters,
} from "@/lib/shopify/transforms/filters";
import {
  transformFilteredShopifyProductCard,
  transformShopifyProductCard,
  transformShopifyProductDetails,
} from "@/lib/shopify/transforms/product";

const GET_PRODUCTS_BY_IDS_QUERY = gql(
  `#graphql
  query getProductsByIds($ids: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      __typename
      ... on Product {
        ...ProductCardFields
      }
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

export async function fetchProductsByIds({
  ids,
  locale = shopConfig.localization,
}: {
  ids: string[];
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  if (ids.length === 0) {
    return [];
  }

  const gids = ids.map(decodeShopifyId);

  const response = await storefront.request(GET_PRODUCTS_BY_IDS_QUERY, {
    locale,
    variables: { ids: gids },
  });
  assertStorefrontOk(response, "getProductsByIds");
  const { data } = response;

  const shopifyProducts = data.nodes.flatMap((node) =>
    node?.__typename === "Product" ? [node] : [],
  );

  return shopifyProducts.map(transformShopifyProductCard);
}

function escapeProductQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

// SearchSortKeys only supports PRICE and RELEVANCE — used by the AI agent text-search path.
const SEARCH_SORT_KEY_MAP: Record<string, { sortKey: SearchSortKeys; reverse: boolean }> = {
  "best-matches": { sortKey: "RELEVANCE", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  PRICE: { sortKey: "PRICE", reverse: false },
  RELEVANCE: { sortKey: "RELEVANCE", reverse: false },
};

const COLLECTION_SORT_KEY_MAP: Record<
  string,
  { sortKey: ProductCollectionSortKeys; reverse: boolean }
> = {
  "best-matches": { sortKey: "COLLECTION_DEFAULT", reverse: false },
  "best-selling": { sortKey: "BEST_SELLING", reverse: false },
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "product-name-ascending": { sortKey: "TITLE", reverse: false },
  "product-name-descending": { sortKey: "TITLE", reverse: true },
  "date-old-to-new": { sortKey: "CREATED", reverse: false },
  "date-new-to-old": { sortKey: "CREATED", reverse: true },
  TITLE: { sortKey: "TITLE", reverse: false },
  PRICE: { sortKey: "PRICE", reverse: false },
  BEST_SELLING: { sortKey: "BEST_SELLING", reverse: false },
  CREATED: { sortKey: "CREATED", reverse: false },
  ID: { sortKey: "ID", reverse: false },
  MANUAL: { sortKey: "MANUAL", reverse: false },
  COLLECTION_DEFAULT: { sortKey: "COLLECTION_DEFAULT", reverse: false },
};

const PRODUCTS_SEARCH_QUERY = gql(
  `#graphql
  query searchProducts($query: String!, $first: Int!, $after: String, $productFilters: [ProductFilter!], $sortKey: SearchSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    search(
      query: $query
      first: $first
      after: $after
      productFilters: $productFilters
      sortKey: $sortKey
      reverse: $reverse
      types: PRODUCT
    ) {
      totalCount
      edges {
        cursor
        node {
          __typename
          ... on Product {
            ...FilterableProductCardFields
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      productFilters {
        values {
          label
          input
        }
      }
    }
  }
`,
  [FILTERABLE_PRODUCT_CARD_FRAGMENT],
);

const COLLECTION_PRODUCTS_QUERY = gql(
  `#graphql
  query collectionProducts($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
        filters {
          ...FilterFields
        }
        edges {
          cursor
          node {
            ...FilterableProductCardFields
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`,
  [FILTER_FRAGMENT, FILTERABLE_PRODUCT_CARD_FRAGMENT],
);

const GET_PRODUCT_WITH_VARIANTS_QUERY = gql(
  `#graphql
  query getProductWithVariants($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductWithVariantsFields
    }
  }
`,
  [PRODUCT_WITH_VARIANTS_FRAGMENT],
);

const COMPLEMENTARY_PRODUCTS_QUERY = gql(
  `#graphql
  query complementaryProducts($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productRecommendations(productHandle: $handle, intent: COMPLEMENTARY) {
      ...ProductCardFields
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

const RELATED_PRODUCTS_QUERY = gql(
  `#graphql
  query relatedProducts($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productRecommendations(productHandle: $handle, intent: RELATED) {
      ...ProductCardFields
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);
// `products` drops variant/metafield filters, so /search must use the `search` field.
export async function fetchSearchIndexProducts(
  params: SearchIndexProductsParams,
): Promise<SearchIndexProductsResult> {
  const {
    activeFilters = {},
    collection,
    cursor,
    filters = [],
    limit = 50,
    locale = shopConfig.localization,
    query,
    sortKey: rawSortKey = "best-matches",
  } = params;
  const sortConfig = SEARCH_SORT_KEY_MAP[rawSortKey] ?? SEARCH_SORT_KEY_MAP["best-matches"];
  const trimmedQuery = query?.trim() ?? "";
  const queryParts: string[] = [];
  if (trimmedQuery) queryParts.push(trimmedQuery);
  if (collection) queryParts.push(`collection:'${escapeProductQuery(collection)}'`);
  const searchQuery = queryParts.length > 0 ? queryParts.join(" AND ") : "*";
  const response = await storefront.request(PRODUCTS_SEARCH_QUERY, {
    locale,
    variables: {
      query: searchQuery,
      first: limit,
      after: cursor,
      productFilters: filters.length > 0 ? filters : undefined,
      sortKey: sortConfig.sortKey,
      reverse: sortConfig.reverse,
    },
  });
  assertStorefrontOk(response, "searchProducts");
  const { data } = response;
  const shopifyProducts = data.search.edges.flatMap((edge) =>
    edge.node.__typename === "Product" ? [edge.node] : [],
  );
  const selectedColor = getSelectedColorFilterLabel(
    activeFilters,
    filters,
    data.search.productFilters,
  );
  return {
    pageInfo: data.search.pageInfo,
    products: shopifyProducts.map((product) =>
      transformFilteredShopifyProductCard(product, selectedColor),
    ),
    total: data.search.totalCount,
  };
}

export async function fetchCollectionProducts(
  params: CollectionProductsParams,
): Promise<CollectionProductsResult> {
  const {
    activeFilters = {},
    collection,
    cursor,
    filters = [],
    limit = 50,
    locale = shopConfig.localization,
    sortKey: rawSortKey = "best-matches",
  } = params;
  const sortConfig = COLLECTION_SORT_KEY_MAP[rawSortKey] ?? COLLECTION_SORT_KEY_MAP["best-matches"];
  const response = await storefront.request(COLLECTION_PRODUCTS_QUERY, {
    locale,
    variables: {
      handle: collection,
      first: limit,
      after: cursor,
      sortKey: sortConfig.sortKey,
      reverse: sortConfig.reverse,
      filters: filters.length > 0 ? filters : undefined,
    },
  });
  assertStorefrontOk(response, "collectionProducts");
  const { data } = response;
  if (!data.collection) {
    return {
      filters: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
      products: [],
    };
  }
  const shopifyProducts = flattenConnection(data.collection.products);
  const selectedColor = getSelectedColorFilterLabel(
    activeFilters,
    filters,
    data.collection.products.filters,
  );
  const products = shopifyProducts.map((product) =>
    transformFilteredShopifyProductCard(product, selectedColor),
  );
  const transformed = transformShopifyFilters(data.collection.products.filters, {
    activeFilters,
    currencyCode: products[0]?.price.currencyCode,
  });
  return {
    filters: transformed.filters,
    pageInfo: data.collection.products.pageInfo,
    priceRange: transformed.priceRange,
    products,
  };
}

export async function fetchProductWithVariants({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  const response = await storefront.request(GET_PRODUCT_WITH_VARIANTS_QUERY, {
    locale,
    variables: { handle },
  });
  assertStorefrontOk(response, "getProductWithVariants");
  const { data } = response;

  if (!data.productByHandle) return undefined;
  return transformShopifyProductDetails(data.productByHandle);
}

export async function fetchComplementaryProducts({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  const response = await storefront.request(COMPLEMENTARY_PRODUCTS_QUERY, {
    locale,
    variables: { handle },
  });
  assertStorefrontOk(response, "complementaryProducts");

  return (response.data.productRecommendations ?? []).map(transformShopifyProductCard);
}

export async function fetchRelatedProducts({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  const response = await storefront.request(RELATED_PRODUCTS_QUERY, {
    locale,
    variables: { handle },
  });
  assertStorefrontOk(response, "relatedProducts");

  return (response.data.productRecommendations ?? []).map(transformShopifyProductCard);
}
const PRODUCT_OPTION_VALUES_QUERY = gql(`#graphql
  query productOptionValues($ids: [ID!]!) {
    nodes(ids: $ids) {
      __typename
      ... on Product {
        handle
        options {
          name
          optionValues {
            name
          }
        }
      }
    }
  }
`);
/**
 * Option values per product handle, lowercased for comparison. ProductCardFields only carries
 * the default variant's options, so a product's other colors/sizes need this separate read.
 */
export async function fetchProductOptionValues(ids: string[]): Promise<ProductOptionValues> {
  const byHandle: ProductOptionValues = new Map();
  if (ids.length === 0) return byHandle;

  const response = await storefront.request(PRODUCT_OPTION_VALUES_QUERY, { variables: { ids } });
  assertStorefrontOk(response, "productOptionValues");

  for (const node of response.data.nodes) {
    if (node?.__typename !== "Product") continue;
    const options = new Map<string, Set<string>>();
    for (const option of node.options) {
      options.set(
        option.name.toLowerCase(),
        new Set(option.optionValues.map((value) => value.name.toLowerCase())),
      );
    }
    byHandle.set(node.handle, options);
  }
  return byHandle;
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
