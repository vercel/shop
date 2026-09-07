import { flattenConnection, gql } from "@shopify/hydrogen";
import type {
  ProductCollectionSortKeys,
  ProductSortKeys,
  SearchSortKeys,
} from "@shopify/hydrogen/storefront-api-types";
import { cacheLife, cacheTag } from "next/cache";

import { shopConfig } from "@/lib/config";
import { defaultLocale } from "@/lib/i18n";
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
import { decodeShopifyId, getNumericShopifyId } from "@/lib/shopify/id/server";
import type {
  CatalogProductsParams,
  CatalogProductsResult,
  CollectionProductsParams,
  CollectionProductsResult,
  FilteredCatalogProductsParams,
  ProductOptionValues,
  SearchFacetsParams,
  SearchFacetsResult,
  SearchIndexProductsParams,
  SearchIndexProductsResult,
} from "@/lib/shopify/operations/products/types";
import { storefront } from "@/lib/shopify/storefront/server";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";
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

function productIdTag(gid: string): string | null {
  const numericId = getNumericShopifyId(gid);
  return numericId ? `product-${numericId}` : null;
}

function tagProducts(products: Array<{ id: string }>): void {
  for (const product of products) {
    const tag = productIdTag(product.id);
    if (tag) {
      cacheTag(tag);
    }
  }
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

export async function getProduct({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: ShopifyLocale;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);

  const response = shopConfig.pdp.bundles.isEnabled
    ? await storefront.request(GET_PRODUCT_BY_HANDLE_WITH_BUNDLES_QUERY, {
        locale,
        variables: { handle },
      })
    : await storefront.request(GET_PRODUCT_BY_HANDLE_QUERY, { locale, variables: { handle } });
  assertStorefrontOk(response, "getProductByHandle");
  const { data } = response;

  if (!data.productByHandle) {
    return undefined;
  }

  tagProducts([data.productByHandle]);

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
export async function getProductVariant({
  handle,
  locale = defaultLocale,
  selectedOptions,
}: {
  handle: string;
  locale?: ShopifyLocale;
  selectedOptions: SelectedOption[];
}): Promise<ProductVariant | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);

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

export async function getProductWithVariants(params: {
  handle: string;
  locale?: ShopifyLocale;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${params.handle}`);

  const product = await fetchProductWithVariants(params);
  if (product) tagProducts([product]);
  return product;
}

const CATALOG_PRODUCTS_QUERY = gql(
  `#graphql
  query catalogProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
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

const CATALOG_SORT_KEY_MAP: Record<string, { sortKey: ProductSortKeys; reverse: boolean }> = {
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
function buildCatalogQuery(args: {
  collection?: string;
  filters: ProductFilter[];
  query?: string;
}): string {
  const parts: string[] = [];

  if (args.query?.trim()) {
    parts.push(args.query.trim());
  }

  if (args.collection) {
    parts.push(`collection:'${escapeProductQuery(args.collection)}'`);
  }

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

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parsePrice(value: string | string[] | undefined): number | undefined {
  if (!value || Array.isArray(value)) return undefined;
  const parsed = Number.parseFloat(value);
  return !Number.isNaN(parsed) && parsed >= 0 ? parsed : undefined;
}

export function buildProductFiltersFromParams(
  searchParams: Record<string, string | string[] | undefined>,
): ProductFilter[] {
  const filters: ProductFilter[] = [];

  for (const [key, value] of Object.entries(searchParams)) {
    if (!key.startsWith("filter.") || !value) continue;

    const optionMatch = key.match(/^filter\.v\.option\.(.+)$/i);
    if (optionMatch) {
      const name = optionMatch[1];
      for (const v of toArray(value)) {
        filters.push({ variantOption: { name, value: v } });
      }
      continue;
    }

    if (key === "filter.v.availability") {
      const v = Array.isArray(value) ? value[0] : value;
      filters.push({ available: v === "1" });
      continue;
    }

    if (key.startsWith("filter.v.price.")) continue;

    if (key === "filter.p.vendor") {
      for (const v of toArray(value)) {
        filters.push({ productVendor: v });
      }
      continue;
    }

    if (key === "filter.p.product_type") {
      for (const v of toArray(value)) {
        filters.push({ productType: v });
      }
      continue;
    }

    if (key === "filter.p.tag") {
      for (const v of toArray(value)) {
        filters.push({ tag: v });
      }
      continue;
    }

    const metaMatch = key.match(/^filter\.p\.m\.([^.]+)\.(.+)$/i);
    if (metaMatch) {
      for (const v of toArray(value)) {
        filters.push({
          productMetafield: { namespace: metaMatch[1], key: metaMatch[2], value: v },
        });
      }
      continue;
    }

    const taxonomyMatch = key.match(/^filter\.[vp]\.t\.([^.]+)\.(.+)$/i);
    if (taxonomyMatch) {
      for (const v of toArray(value)) {
        filters.push({
          taxonomyMetafield: { namespace: taxonomyMatch[1], key: taxonomyMatch[2], value: v },
        });
      }
      continue;
    }
  }

  const min = parsePrice(searchParams["filter.v.price.gte"]);
  const max = parsePrice(searchParams["filter.v.price.lte"]);
  if (min !== undefined || max !== undefined) {
    const priceFilter: { min?: number; max?: number } = {};
    if (min !== undefined) priceFilter.min = min;
    if (max !== undefined) priceFilter.max = max;
    filters.push({ price: priceFilter });
  }

  return filters;
}

async function fetchCatalogProducts({
  collection,
  cursor,
  filters = [],
  limit = 50,
  locale = defaultLocale,
  query,
  sortKey: rawSortKey = "best-matches",
}: FilteredCatalogProductsParams): Promise<CatalogProductsResult> {
  const sortConfig = CATALOG_SORT_KEY_MAP[rawSortKey] ?? CATALOG_SORT_KEY_MAP["best-matches"];
  const catalogQuery = buildCatalogQuery({ query, collection, filters });

  // RELEVANCE is meaningless without a query; fall back to BEST_SELLING for plain browse.
  const sortKey =
    sortConfig.sortKey === "RELEVANCE" && !catalogQuery ? "BEST_SELLING" : sortConfig.sortKey;

  const response = await storefront.request(CATALOG_PRODUCTS_QUERY, {
    locale,
    variables: {
      first: limit,
      after: cursor,
      query: catalogQuery || undefined,
      sortKey,
      reverse: sortConfig.reverse,
    },
  });
  assertStorefrontOk(response, "catalogProducts");
  const { data } = response;

  const shopifyProducts = flattenConnection(data.products);

  tagProducts(shopifyProducts);

  return {
    pageInfo: data.products.pageInfo,
    products: shopifyProducts.map(transformShopifyProductCard),
  };
}

export async function getCatalogProducts(
  params: CatalogProductsParams,
): Promise<CatalogProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  return fetchCatalogProducts(params);
}

export async function getFilteredCatalogProducts(
  params: FilteredCatalogProductsParams,
): Promise<CatalogProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  return fetchCatalogProducts(params);
}

// Browse facets stay uncached so Search & Discovery changes appear immediately.
export async function fetchSearchFacets(params: SearchFacetsParams): Promise<SearchFacetsResult> {
  const { activeFilters = {}, collection, filters = [], locale = defaultLocale, query } = params;

  const queryParts: string[] = [];
  if (query?.trim()) queryParts.push(query.trim());
  if (collection) queryParts.push(`collection:'${escapeProductQuery(collection)}'`);
  const searchQuery = queryParts.length > 0 ? queryParts.join(" AND ") : "*";

  const response = await storefront.request(SEARCH_FACETS_QUERY, {
    locale,
    variables: {
      query: searchQuery,
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

export async function getProductOptionValues(params: {
  ids: string[];
}): Promise<ProductOptionValues> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  return fetchProductOptionValues(params.ids);
}

export async function searchIndexProducts(
  params: SearchIndexProductsParams,
): Promise<SearchIndexProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const result = await fetchSearchIndexProducts(params);
  tagProducts(result.products);
  return result;
}

export async function getCollectionProducts(
  params: CollectionProductsParams,
): Promise<CollectionProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collections", `collection-${params.collection}`);

  const result = await fetchCollectionProducts(params);
  tagProducts(result.products);
  return result;
}

// Initial collection grids can be prepared on intent; cursor-based browse requests stay live.
export async function getInitialCollectionProducts(
  params: Omit<CollectionProductsParams, "cursor">,
): Promise<CollectionProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collections", "collection-results", `collection-${params.collection}`);

  const result = await fetchCollectionProducts(params);
  tagProducts(result.products);
  return result;
}

export async function getInitialAllProducts(
  params: Omit<SearchIndexProductsParams, "collection" | "cursor" | "query">,
): Promise<CollectionProductsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collection-results");

  const [products, facets] = await Promise.all([
    fetchSearchIndexProducts(params),
    fetchSearchFacets({
      activeFilters: params.activeFilters,
      filters: params.filters,
      locale: params.locale,
    }),
  ]);
  tagProducts(products.products);
  return {
    filters: facets.filters,
    pageInfo: products.pageInfo,
    priceRange: facets.priceRange,
    products: products.products,
  };
}

export async function getComplementaryProducts(params: {
  handle: string;
  locale?: ShopifyLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${params.handle}`);

  const products = await fetchComplementaryProducts(params);
  tagProducts(products);
  return products;
}

export async function getRelatedProducts(params: {
  handle: string;
  locale?: ShopifyLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${params.handle}`);

  const products = await fetchRelatedProducts(params);
  tagProducts(products);
  return products;
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

export async function getProductsByIds({
  ids,
  locale = defaultLocale,
}: {
  ids: string[];
  locale?: ShopifyLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

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

  tagProducts(shopifyProducts);

  return shopifyProducts.map(transformShopifyProductCard);
}

export function escapeProductQuery(value: string): string {
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
    locale = defaultLocale,
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
    locale = defaultLocale,
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
  locale = defaultLocale,
}: {
  handle: string;
  locale?: ShopifyLocale;
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
  locale = defaultLocale,
}: {
  handle: string;
  locale?: ShopifyLocale;
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
  locale = defaultLocale,
}: {
  handle: string;
  locale?: ShopifyLocale;
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
