import { flattenConnection, gql, parseSortByValue } from "@shopify/hydrogen";
import type { ProductFilter } from "@shopify/hydrogen";
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
import type { StorefrontVariables } from "@/lib/shopify/storefront/types";
import {
  getSelectedColorFilterLabel,
  transformShopifyFilters,
} from "@/lib/shopify/transforms/filters";
import {
  transformFilteredShopifyProductCard,
  transformShopifyProductCard,
  transformShopifyProductDetails,
  transformVariant,
} from "@/lib/shopify/transforms/product";

function escapeProductQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

type StorefrontProductFilter = NonNullable<
  NonNullable<StorefrontVariables<typeof COLLECTION_PRODUCTS_QUERY>["filters"]>[number]
>;

// Hydrogen's ProductFilter folds the taxonomy namespace into `key`; the Storefront schema wants them apart.
function toStorefrontFilters(filters: ProductFilter[]): StorefrontProductFilter[] | undefined {
  if (filters.length === 0) return undefined;
  return filters.map((filter) => {
    if (!filter.taxonomyMetafield) return filter as StorefrontProductFilter;
    const [namespace, ...key] = filter.taxonomyMetafield.key.split(".");
    return {
      taxonomyMetafield: { key: key.join("."), namespace, value: filter.taxonomyMetafield.value },
    };
  });
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

// QueryRoot.products sorts by CREATED_AT where collections sort by CREATED.
function toProductsSort(
  sortBy: string | undefined,
  hasQuery: boolean,
): { reverse: boolean; sortKey: ProductSortKeys } {
  const parsed = sortBy ? parseSortByValue(sortBy) : undefined;
  switch (parsed?.sortKey) {
    case "BEST_SELLING":
      return { reverse: parsed.reverse, sortKey: "BEST_SELLING" };
    case "CREATED":
      return { reverse: parsed.reverse, sortKey: "CREATED_AT" };
    case "PRICE":
      return { reverse: parsed.reverse, sortKey: "PRICE" };
    case "TITLE":
      return { reverse: parsed.reverse, sortKey: "TITLE" };
    default:
      // RELEVANCE is meaningless without a query; BEST_SELLING is the browse default.
      return { reverse: false, sortKey: hasQuery ? "RELEVANCE" : "BEST_SELLING" };
  }
}

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
  sortKey: sortBy,
}: FilteredProductsParams): Promise<ProductsResult> {
  const productsQuery = buildProductsQuery({ query, collection, filters });
  const { reverse, sortKey } = toProductsSort(sortBy, Boolean(productsQuery));

  const response = await storefront.request(PRODUCTS_QUERY, {
    locale,
    variables: {
      first: limit,
      after: cursor,
      query: productsQuery || undefined,
      sortKey,
      reverse,
    },
  });
  assertStorefrontOk(response, "products");
  const { data } = response;

  return {
    pageInfo: data.products.pageInfo,
    products: flattenConnection(data.products).map(transformShopifyProductCard),
  };
}

// Storefront search sorts by RELEVANCE or PRICE only.
function toSearchSort(sortBy: string | undefined): { reverse: boolean; sortKey: SearchSortKeys } {
  const parsed = sortBy ? parseSortByValue(sortBy) : undefined;
  return parsed?.sortKey === "PRICE"
    ? { reverse: parsed.reverse, sortKey: "PRICE" }
    : { reverse: false, sortKey: "RELEVANCE" };
}

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
    collection,
    cursor,
    filters = [],
    limit = 50,
    locale = shopConfig.localization,
    query,
    sortKey: sortBy,
  } = params;
  const sort = toSearchSort(sortBy);
  const response = await storefront.request(PRODUCTS_SEARCH_QUERY, {
    locale,
    variables: {
      query: buildSearchQuery(query, collection),
      first: limit,
      after: cursor,
      productFilters: toStorefrontFilters(filters),
      sortKey: sort.sortKey,
      reverse: sort.reverse,
    },
  });
  assertStorefrontOk(response, "searchProducts");
  const { data } = response;
  const shopifyProducts = data.search.edges.flatMap((edge) =>
    edge.node.__typename === "Product" ? [edge.node] : [],
  );
  const selectedColor = getSelectedColorFilterLabel(filters, data.search.productFilters);
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
  const { collection, filters = [], locale = shopConfig.localization, query } = params;
  const response = await storefront.request(SEARCH_FACETS_QUERY, {
    locale,
    variables: {
      query: buildSearchQuery(query, collection),
      productFilters: toStorefrontFilters(filters),
    },
  });
  assertStorefrontOk(response, "searchFacets");
  const { data } = response;
  const currencyCode = data.search.nodes.flatMap((node) =>
    node.__typename === "Product" ? [node.priceRange.minVariantPrice.currencyCode] : [],
  )[0];
  const transformed = transformShopifyFilters(data.search.productFilters, {
    activeFilters: filters,
    currencyCode,
  });
  return {
    filters: transformed.filters,
    priceRange: transformed.priceRange,
    total: data.search.totalCount,
  };
}

// MANUAL is only valid for manual collections, so the merchant default covers both kinds.
function toCollectionSort(sortBy: string | undefined): {
  reverse: boolean;
  sortKey: ProductCollectionSortKeys;
} {
  const parsed = sortBy ? parseSortByValue(sortBy) : undefined;
  if (!parsed?.sortKey || parsed.sortKey === "MANUAL")
    return { reverse: false, sortKey: "COLLECTION_DEFAULT" };
  return { reverse: parsed.reverse, sortKey: parsed.sortKey };
}

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
    collection,
    cursor,
    filters = [],
    limit = 50,
    locale = shopConfig.localization,
    sortKey: sortBy,
  } = params;
  const sort = toCollectionSort(sortBy);
  const response = await storefront.request(COLLECTION_PRODUCTS_QUERY, {
    locale,
    variables: {
      handle: collection,
      first: limit,
      after: cursor,
      sortKey: sort.sortKey,
      reverse: sort.reverse,
      filters: toStorefrontFilters(filters),
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
  const selectedColor = getSelectedColorFilterLabel(filters, data.collection.products.filters);
  const products = shopifyProducts.map((product) =>
    transformFilteredShopifyProductCard(product, selectedColor),
  );
  const transformed = transformShopifyFilters(data.collection.products.filters, {
    activeFilters: filters,
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
