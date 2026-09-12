import { flattenConnection, gql } from "@shopify/hydrogen";
import type {
  ProductCollectionSortKeys,
  ProductSortKeys,
  SearchSortKeys,
} from "@shopify/hydrogen/storefront-api-types";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type {
  ProductCard,
  ProductDetails,
  ProductVariant,
  SelectedOption,
} from "@/lib/product/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { BUNDLE_RELATIONSHIPS_FRAGMENT } from "@/lib/shopify/fragments/bundle";
import { FILTER_FRAGMENT } from "@/lib/shopify/fragments/filters";
import {
  FILTERABLE_PRODUCT_CARD_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_FRAGMENT,
  PRODUCT_WITH_VARIANTS_FRAGMENT,
} from "@/lib/shopify/fragments/product";
import {
  PRODUCT_VARIANT_FRAGMENT,
  PURCHASABLE_PRODUCT_VARIANT_FRAGMENT,
} from "@/lib/shopify/fragments/variant";
import { decodeShopifyId } from "@/lib/shopify/id/server";
import type {
  CollectionProductsParams,
  CollectionProductsResult,
  FilteredProductsParams,
  ProductOptionValues,
  ProductsResult,
  SearchFacetsParams,
  SearchFacetsResult,
  SearchIndexProductsParams,
  SearchIndexProductsResult,
} from "@/lib/shopify/operations/products/types";
import { storefront } from "@/lib/shopify/storefront/server";
import {
  getSelectedColorFilterLabel,
  transformShopifyFilters,
} from "@/lib/shopify/transforms/filters";
import type { ProductFilter } from "@/lib/shopify/transforms/filters/types";
import {
  transformFilteredShopifyProductCard,
  transformShopifyProductCard,
  transformShopifyProductDetails,
  transformVariant,
} from "@/lib/shopify/transforms/product";

function escapeProductQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

const GET_PRODUCT_BY_HANDLE_QUERY = gql(
  `#graphql
  query getProductByHandle($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductFields
    }
  }
`,
  [PRODUCT_FRAGMENT],
);

const GET_PRODUCT_BY_HANDLE_WITH_BUNDLES_QUERY = gql(
  `#graphql
  query getProductByHandleWithBundles($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductFields
      selectedOrFirstAvailableVariant {
        ...BundleRelationshipFields
      }
      # Sparse variants resolve client-side, so they need the bundle gate too.
      adjacentVariants {
        ...BundleRelationshipFields
      }
      options {
        optionValues {
          firstSelectableVariant {
            ...BundleRelationshipFields
          }
        }
      }
    }
  }
`,
  [BUNDLE_RELATIONSHIPS_FRAGMENT, PRODUCT_FRAGMENT],
);

export async function fetchProduct({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  const response = shopConfig.pdp.bundles.isEnabled
    ? await storefront.request(GET_PRODUCT_BY_HANDLE_WITH_BUNDLES_QUERY, {
        locale,
        variables: { handle },
      })
    : await storefront.request(GET_PRODUCT_BY_HANDLE_QUERY, { locale, variables: { handle } });
  assertStorefrontOk(response, "getProductByHandle");
  const { data } = response;

  if (!data.productByHandle) return undefined;
  return transformShopifyProductDetails(data.productByHandle);
}

const GET_PRODUCT_VARIANT_QUERY = gql(
  `#graphql
  query getProductVariant($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...ProductVariantFields
      }
    }
  }
`,
  [PRODUCT_VARIANT_FRAGMENT],
);

const GET_PRODUCT_VARIANT_WITH_BUNDLES_QUERY = gql(
  `#graphql
  query getProductVariantWithBundles($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...PurchasableProductVariantFields
      }
    }
  }
`,
  [PURCHASABLE_PRODUCT_VARIANT_FRAGMENT],
);

// Empty selections intentionally resolve Shopify's first available variant.
export async function fetchProductVariant({
  handle,
  locale = shopConfig.localization,
  selectedOptions,
}: {
  handle: string;
  locale?: CommerceLocale;
  selectedOptions: SelectedOption[];
}): Promise<ProductVariant | undefined> {
  const response = shopConfig.pdp.bundles.isEnabled
    ? await storefront.request(GET_PRODUCT_VARIANT_WITH_BUNDLES_QUERY, {
        locale,
        variables: { handle, selectedOptions },
      })
    : await storefront.request(GET_PRODUCT_VARIANT_QUERY, {
        locale,
        variables: { handle, selectedOptions },
      });
  assertStorefrontOk(response, "getProductVariant");
  const { data } = response;

  const variant = data.productByHandle?.selectedOrFirstAvailableVariant;
  return variant ? transformVariant(variant) : undefined;
}

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
  if (ids.length === 0) return [];

  const response = await storefront.request(GET_PRODUCTS_BY_IDS_QUERY, {
    locale,
    variables: { ids: ids.map(decodeShopifyId) },
  });
  assertStorefrontOk(response, "getProductsByIds");
  const { data } = response;

  return data.nodes
    .flatMap((node) => (node?.__typename === "Product" ? [node] : []))
    .map(transformShopifyProductCard);
}

const PRODUCTS_QUERY = gql(
  `#graphql
  query products($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(
      first: $first
      after: $after
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      edges {
        cursor
        node {
          ...ProductCardFields
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
`,
  [PRODUCT_CARD_FRAGMENT],
);

const PRODUCTS_SORT_KEY_MAP: Record<string, { sortKey: ProductSortKeys; reverse: boolean }> = {
  "best-matches": { sortKey: "RELEVANCE", reverse: false },
  "best-selling": { sortKey: "BEST_SELLING", reverse: false },
  "date-new-to-old": { sortKey: "CREATED_AT", reverse: true },
  "date-old-to-new": { sortKey: "CREATED_AT", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  "product-name-ascending": { sortKey: "TITLE", reverse: false },
  "product-name-descending": { sortKey: "TITLE", reverse: true },
  BEST_SELLING: { sortKey: "BEST_SELLING", reverse: false },
  CREATED_AT: { sortKey: "CREATED_AT", reverse: false },
  ID: { sortKey: "ID", reverse: false },
  PRICE: { sortKey: "PRICE", reverse: false },
  PRODUCT_TYPE: { sortKey: "PRODUCT_TYPE", reverse: false },
  RELEVANCE: { sortKey: "RELEVANCE", reverse: false },
  TITLE: { sortKey: "TITLE", reverse: false },
  UPDATED_AT: { sortKey: "UPDATED_AT", reverse: false },
  VENDOR: { sortKey: "VENDOR", reverse: false },
};

function joinOr(field: string, values: string[]): string {
  const expressions = values.map((v) => `${field}:'${escapeProductQuery(v)}'`);
  return expressions.length > 1 ? `(${expressions.join(" OR ")})` : expressions[0];
}

// QueryRoot.products has no productFilters arg, so filters are encoded into the query string; variantOption/productMetafield are dropped.
function buildProductsQuery(args: {
  collection?: string;
  filters: ProductFilter[];
  query?: string;
}): string {
  const parts: string[] = [];

  if (args.query?.trim()) parts.push(args.query.trim());
  if (args.collection) parts.push(`collection:'${escapeProductQuery(args.collection)}'`);

  const vendors: string[] = [];
  const types: string[] = [];
  const tags: string[] = [];
  let available: boolean | undefined;
  let priceMin: number | undefined;
  let priceMax: number | undefined;

  for (const f of args.filters) {
    if (f.productVendor) vendors.push(f.productVendor);
    if (f.productType) types.push(f.productType);
    if (f.tag) tags.push(f.tag);
    if (f.available !== undefined) available = f.available;
    if (f.price?.min !== undefined) priceMin = f.price.min;
    if (f.price?.max !== undefined) priceMax = f.price.max;
  }

  if (vendors.length) parts.push(joinOr("vendor", vendors));
  if (types.length) parts.push(joinOr("product_type", types));
  if (tags.length) parts.push(joinOr("tag", tags));
  if (available !== undefined) parts.push(`available_for_sale:${available}`);
  if (priceMin !== undefined) parts.push(`variants.price:>=${priceMin}`);
  if (priceMax !== undefined) parts.push(`variants.price:<=${priceMax}`);

  return parts.join(" AND ");
}

export async function fetchProducts({
  collection,
  cursor,
  filters = [],
  limit = 50,
  locale = shopConfig.localization,
  query,
  sortKey: rawSortKey = "best-matches",
}: FilteredProductsParams): Promise<ProductsResult> {
  const sortConfig = PRODUCTS_SORT_KEY_MAP[rawSortKey] ?? PRODUCTS_SORT_KEY_MAP["best-matches"];
  const productsQuery = buildProductsQuery({ query, collection, filters });

  // RELEVANCE is meaningless without a query; fall back to BEST_SELLING for plain browse.
  const sortKey =
    sortConfig.sortKey === "RELEVANCE" && !productsQuery ? "BEST_SELLING" : sortConfig.sortKey;

  const response = await storefront.request(PRODUCTS_QUERY, {
    locale,
    variables: {
      first: limit,
      after: cursor,
      query: productsQuery || undefined,
      sortKey,
      reverse: sortConfig.reverse,
    },
  });
  assertStorefrontOk(response, "products");
  const { data } = response;

  return {
    pageInfo: data.products.pageInfo,
    products: flattenConnection(data.products).map(transformShopifyProductCard),
  };
}

// SearchSortKeys only supports PRICE and RELEVANCE.
const SEARCH_SORT_KEY_MAP: Record<string, { sortKey: SearchSortKeys; reverse: boolean }> = {
  "best-matches": { sortKey: "RELEVANCE", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  PRICE: { sortKey: "PRICE", reverse: false },
  RELEVANCE: { sortKey: "RELEVANCE", reverse: false },
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

function buildSearchQuery(query: string | undefined, collection: string | undefined): string {
  const parts: string[] = [];
  if (query?.trim()) parts.push(query.trim());
  if (collection) parts.push(`collection:'${escapeProductQuery(collection)}'`);
  return parts.length > 0 ? parts.join(" AND ") : "*";
}

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
  const response = await storefront.request(PRODUCTS_SEARCH_QUERY, {
    locale,
    variables: {
      query: buildSearchQuery(query, collection),
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

const SEARCH_FACETS_QUERY = gql(
  `#graphql
  query searchFacets($query: String!, $productFilters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    search(
      query: $query
      productFilters: $productFilters
      types: PRODUCT
      first: 1
    ) {
      totalCount
      nodes {
        __typename
        ... on Product {
          priceRange {
            minVariantPrice {
              currencyCode
            }
          }
        }
      }
      productFilters {
        ...FilterFields
      }
    }
  }
`,
  [FILTER_FRAGMENT],
);

export async function fetchSearchFacets(params: SearchFacetsParams): Promise<SearchFacetsResult> {
  const {
    activeFilters = {},
    collection,
    filters = [],
    locale = shopConfig.localization,
    query,
  } = params;
  const response = await storefront.request(SEARCH_FACETS_QUERY, {
    locale,
    variables: {
      query: buildSearchQuery(query, collection),
      productFilters: filters.length > 0 ? filters : undefined,
    },
  });
  assertStorefrontOk(response, "searchFacets");
  const { data } = response;
  const currencyCode = data.search.nodes.flatMap((node) =>
    node.__typename === "Product" ? [node.priceRange.minVariantPrice.currencyCode] : [],
  )[0];
  const transformed = transformShopifyFilters(data.search.productFilters, {
    activeFilters,
    currencyCode,
  });
  return {
    filters: transformed.filters,
    priceRange: transformed.priceRange,
    total: data.search.totalCount,
  };
}

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

// ProductCardFields only carries the default variant's options, so other colors/sizes need this read.
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
