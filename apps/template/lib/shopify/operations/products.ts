import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type {
  Filter,
  PageInfo,
  PriceRange,
  ProductCard,
  ProductDetails,
  ProductVariant,
  SelectedOption,
} from "@/lib/types";

import { shopifyFetch } from "../fetch";
import {
  IMAGE_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_FRAGMENT,
  PRODUCT_WITH_VARIANTS_FRAGMENT,
  PURCHASABLE_PRODUCT_VARIANT_FRAGMENT,
} from "../fragments";
import { transformShopifyFilters } from "../transforms/filters";
import {
  type ShopifyProduct,
  type ShopifyProductCard,
  type ShopifyVariant,
  transformShopifyProductCard,
  transformShopifyProductDetails,
  transformVariant,
} from "../transforms/product";
import type { ProductFilter, ShopifyFilter } from "../types/filters";
import { getNumericShopifyId } from "../utils";

type ActiveFilters = Record<string, string | string[] | undefined>;

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

const GET_PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query getProductByHandle($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductFields
    }
  }
`;

export async function getProduct({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<{
    productByHandle: ShopifyProduct;
  }>({
    operation: "getProductByHandle",
    query: GET_PRODUCT_BY_HANDLE_QUERY,
    variables: { handle, country, language },
  });

  if (!data.productByHandle) {
    return undefined;
  }

  tagProducts([data.productByHandle]);

  return transformShopifyProductDetails(data.productByHandle);
}

const GET_PRODUCT_VARIANT_QUERY = `
  ${IMAGE_FRAGMENT}
  ${PURCHASABLE_PRODUCT_VARIANT_FRAGMENT}
  query getProductVariant($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...PurchasableProductVariantFields
      }
    }
  }
`;

// Resolves the active variant from selected options (the suspended PDP query).
// Empty selectedOptions returns the first available variant — matches the
// no-params / partial-selection fallback the PDP relies on.
export async function getProductVariant({
  handle,
  locale = defaultLocale,
  selectedOptions,
}: {
  handle: string;
  locale?: string;
  selectedOptions: SelectedOption[];
}): Promise<ProductVariant | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<{
    productByHandle: { selectedOrFirstAvailableVariant: ShopifyVariant | null } | null;
  }>({
    operation: "getProductVariant",
    query: GET_PRODUCT_VARIANT_QUERY,
    variables: { handle, selectedOptions, country, language },
  });

  const variant = data.productByHandle?.selectedOrFirstAvailableVariant;
  return variant ? transformVariant(variant) : undefined;
}

const GET_PRODUCT_WITH_VARIANTS_QUERY = `
  ${PRODUCT_WITH_VARIANTS_FRAGMENT}
  query getProductWithVariants($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductWithVariantsFields
    }
  }
`;

// Slim shell + full variant matrix; for the AI agent and markdown routes that
// enumerate variants. The PDP uses getProduct + getProductVariant instead.
export async function getProductWithVariants({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<{
    productByHandle: ShopifyProduct;
  }>({
    operation: "getProductWithVariants",
    query: GET_PRODUCT_WITH_VARIANTS_QUERY,
    variables: { handle, country, language },
  });

  if (!data.productByHandle) {
    return undefined;
  }

  tagProducts([data.productByHandle]);

  return transformShopifyProductDetails(data.productByHandle);
}

const CATALOG_PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
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
`;

const SEARCH_FACETS_QUERY = `
  query searchFacets($query: String!, $productFilters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    search(
      query: $query
      productFilters: $productFilters
      types: PRODUCT
      first: 1
    ) {
      totalCount
      productFilters {
        id
        label
        type
        values {
          id
          label
          count
          input
        }
      }
    }
  }
`;

const PRODUCTS_SEARCH_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
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
          ... on Product {
            ...ProductCardFields
          }
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
`;

// QueryRoot.products(sortKey: ProductSortKeys) — used for the catalog browse path.
const CATALOG_SORT_KEY_MAP: Record<string, { sortKey: string; reverse: boolean }> = {
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

// SearchSortKeys only supports PRICE and RELEVANCE — used by the AI agent text-search path.
const SEARCH_SORT_KEY_MAP: Record<string, { sortKey: string; reverse: boolean }> = {
  "best-matches": { sortKey: "RELEVANCE", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  PRICE: { sortKey: "PRICE", reverse: false },
  RELEVANCE: { sortKey: "RELEVANCE", reverse: false },
};

function escapeProductQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

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

    // filter.v.option.{name} → variantOption
    const optionMatch = key.match(/^filter\.v\.option\.(.+)$/i);
    if (optionMatch) {
      const name = optionMatch[1];
      for (const v of toArray(value)) {
        filters.push({ variantOption: { name, value: v } });
      }
      continue;
    }

    // filter.v.availability → available
    if (key === "filter.v.availability") {
      const v = Array.isArray(value) ? value[0] : value;
      filters.push({ available: v === "1" });
      continue;
    }

    // filter.v.price.gte / filter.v.price.lte → handled after loop
    if (key.startsWith("filter.v.price.")) continue;

    // filter.p.vendor → productVendor
    if (key === "filter.p.vendor") {
      for (const v of toArray(value)) {
        filters.push({ productVendor: v });
      }
      continue;
    }

    // filter.p.product_type → productType
    if (key === "filter.p.product_type") {
      for (const v of toArray(value)) {
        filters.push({ productType: v });
      }
      continue;
    }

    // filter.p.tag → tag
    if (key === "filter.p.tag") {
      for (const v of toArray(value)) {
        filters.push({ tag: v });
      }
      continue;
    }

    // filter.p.m.{namespace}.{key} → productMetafield
    const metaMatch = key.match(/^filter\.p\.m\.([^.]+)\.(.+)$/i);
    if (metaMatch) {
      for (const v of toArray(value)) {
        filters.push({
          productMetafield: { namespace: metaMatch[1], key: metaMatch[2], value: v },
        });
      }
      continue;
    }
  }

  // Combine price.gte and price.lte into a single price filter
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

type CatalogProductsResult = {
  pageInfo: PageInfo;
  products: ProductCard[];
};

type CatalogProductsParams = {
  limit?: number;
  locale?: string;
};

type FilteredCatalogProductsParams = CatalogProductsParams & {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  query?: string;
  sortKey?: string;
};

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
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const catalogQuery = buildCatalogQuery({ query, collection, filters });

  // RELEVANCE is meaningless without a query; fall back to BEST_SELLING for plain browse.
  const sortKey =
    sortConfig.sortKey === "RELEVANCE" && !catalogQuery ? "BEST_SELLING" : sortConfig.sortKey;

  const data = await shopifyFetch<{
    products: {
      edges: Array<{ cursor: string; node: ShopifyProductCard | null }>;
      pageInfo: PageInfo;
    };
  }>({
    operation: "catalogProducts",
    query: CATALOG_PRODUCTS_QUERY,
    variables: {
      first: limit,
      after: cursor,
      query: catalogQuery || undefined,
      sortKey,
      reverse: sortConfig.reverse,
      country,
      language,
    },
  });

  const shopifyProducts = data.products.edges
    .map((edge) => edge.node)
    .filter((node): node is ShopifyProductCard => node !== null);

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

export async function getSearchFacets(params: {
  activeFilters?: ActiveFilters;
  collection?: string;
  filters?: ProductFilter[];
  locale?: string;
  query?: string;
}): Promise<{ filters: Filter[]; priceRange?: PriceRange; total: number }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const { activeFilters = {}, collection, filters = [], locale = defaultLocale, query } = params;
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const queryParts: string[] = [];
  if (query?.trim()) queryParts.push(query.trim());
  if (collection) queryParts.push(`collection:'${escapeProductQuery(collection)}'`);
  const searchQuery = queryParts.length > 0 ? queryParts.join(" AND ") : "*";

  const data = await shopifyFetch<{
    search: {
      totalCount: number;
      productFilters: ShopifyFilter[];
    };
  }>({
    operation: "searchFacets",
    query: SEARCH_FACETS_QUERY,
    variables: {
      query: searchQuery,
      productFilters: filters.length > 0 ? filters : undefined,
      country,
      language,
    },
  });

  const transformed = transformShopifyFilters(data.search.productFilters, { activeFilters });

  return {
    filters: transformed.filters,
    priceRange: transformed.priceRange,
    total: data.search.totalCount,
  };
}

// Relevance-ranked search via the Storefront `search` field. Accepts the full ProductFilter set
// (variant options, metafields, etc.) — the products(...) query string in getCatalogProducts
// silently drops variantOption/productMetafield, so /search uses this path even for no-query browse.
export async function searchIndexProducts(params: {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  query?: string;
  sortKey?: string;
}): Promise<{ pageInfo: PageInfo; products: ProductCard[]; total: number }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const {
    collection,
    cursor,
    filters = [],
    limit = 50,
    locale = defaultLocale,
    query,
    sortKey: rawSortKey = "best-matches",
  } = params;

  const sortConfig = SEARCH_SORT_KEY_MAP[rawSortKey] ?? SEARCH_SORT_KEY_MAP["best-matches"];
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const trimmedQuery = query?.trim() ?? "";
  const queryParts: string[] = [];
  if (trimmedQuery) queryParts.push(trimmedQuery);
  if (collection) queryParts.push(`collection:'${escapeProductQuery(collection)}'`);
  const searchQuery = queryParts.length > 0 ? queryParts.join(" AND ") : "*";

  const data = await shopifyFetch<{
    search: {
      totalCount: number;
      edges: Array<{ cursor: string; node: ShopifyProductCard | null }>;
      pageInfo: PageInfo;
    };
  }>({
    operation: "searchProducts",
    query: PRODUCTS_SEARCH_QUERY,
    variables: {
      query: searchQuery,
      first: limit,
      after: cursor,
      productFilters: filters.length > 0 ? filters : undefined,
      sortKey: sortConfig.sortKey,
      reverse: sortConfig.reverse,
      country,
      language,
    },
  });

  const shopifyProducts = data.search.edges
    .map((edge) => edge.node)
    .filter((node): node is ShopifyProductCard => node !== null);

  tagProducts(shopifyProducts);

  return {
    pageInfo: data.search.pageInfo,
    products: shopifyProducts.map(transformShopifyProductCard),
    total: data.search.totalCount,
  };
}

const COLLECTION_PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query collectionProducts($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
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
  }
`;

const COLLECTION_SORT_KEY_MAP: Record<string, { sortKey: string; reverse: boolean }> = {
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

export async function getCollectionProducts(params: {
  activeFilters?: ActiveFilters;
  collection: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  sortKey?: string;
}): Promise<{
  filters: Filter[];
  pageInfo: PageInfo;
  priceRange?: PriceRange;
  products: ProductCard[];
}> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collections", `collection-${params.collection}`);

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
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<{
    collection: {
      products: {
        edges: Array<{ node: ShopifyProductCard }>;
        pageInfo: PageInfo;
        filters: ShopifyFilter[];
      };
    } | null;
  }>({
    operation: "collectionProducts",
    query: COLLECTION_PRODUCTS_QUERY,
    variables: {
      handle: collection,
      first: limit,
      after: cursor,
      sortKey: sortConfig.sortKey,
      reverse: sortConfig.reverse,
      filters: filters.length > 0 ? filters : undefined,
      country,
      language,
    },
  });

  if (!data.collection) {
    return {
      filters: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      products: [],
    };
  }

  const shopifyProducts = data.collection.products.edges.map((edge) => edge.node);

  tagProducts(shopifyProducts);

  const products = shopifyProducts.map(transformShopifyProductCard);
  const transformed = transformShopifyFilters(data.collection.products.filters, { activeFilters });

  return {
    filters: transformed.filters,
    pageInfo: data.collection.products.pageInfo,
    priceRange: transformed.priceRange,
    products,
  };
}

const PRODUCT_RECOMMENDATIONS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query productRecommendations($productId: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      ...ProductCardFields
    }
  }
`;

export async function getProductRecommendations({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${handle}`);

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const product = await getProduct({ handle, locale });
  if (!product) {
    return [];
  }

  const data = await shopifyFetch<{ productRecommendations: ShopifyProductCard[] }>({
    operation: "productRecommendations",
    query: PRODUCT_RECOMMENDATIONS_QUERY,
    variables: { productId: product.id, country, language },
  });

  if (!data.productRecommendations) {
    return [];
  }

  tagProducts(data.productRecommendations);

  return data.productRecommendations.map(transformShopifyProductCard);
}

const GET_PRODUCTS_BY_HANDLES_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query getProductsByHandles($query: String!, $first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: $first, query: $query) {
      edges {
        node {
          ...ProductCardFields
        }
      }
    }
  }
`;

const GET_PRODUCT_BY_ID_QUERY = `
  ${PRODUCT_WITH_VARIANTS_FRAGMENT}
  query getProductById($id: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    node(id: $id) {
      ... on Product {
        ...ProductWithVariantsFields
      }
    }
  }
`;

const GET_PRODUCTS_BY_IDS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query getProductsByIds($ids: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductCardFields
      }
    }
  }
`;

function decodeShopifyId(id: string): string {
  if (id.startsWith("gid://")) {
    return id;
  }
  return Buffer.from(id, "base64").toString("utf-8");
}

export async function getProductById({
  id,
  locale = defaultLocale,
}: {
  id: string;
  locale?: string;
}): Promise<ProductDetails | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const gid = decodeShopifyId(id);

  const data = await shopifyFetch<{ node: ShopifyProduct | null }>({
    operation: "getProductById",
    query: GET_PRODUCT_BY_ID_QUERY,
    variables: { id: gid, country, language },
  });

  const product = data.node;
  if (!product) {
    return undefined;
  }

  cacheTag(`product-${product.handle}`);
  tagProducts([product]);

  return transformShopifyProductDetails(product);
}

/** Results are returned in the same order as the input IDs. */
export async function getProductsByIds({
  ids,
  locale = defaultLocale,
}: {
  ids: string[];
  locale?: string;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  if (ids.length === 0) {
    return [];
  }

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const gids = ids.map(decodeShopifyId);

  const data = await shopifyFetch<{ nodes: (ShopifyProductCard | null)[] }>({
    operation: "getProductsByIds",
    query: GET_PRODUCTS_BY_IDS_QUERY,
    variables: { ids: gids, country, language },
  });

  const shopifyProducts = data.nodes.filter((node): node is ShopifyProductCard => node !== null);

  tagProducts(shopifyProducts);

  return shopifyProducts.map(transformShopifyProductCard);
}

/** Results are reordered to match the input handle order. */
export async function getProductsByHandles({
  handles,
  locale = defaultLocale,
}: {
  handles: string[];
  locale?: string;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  if (handles.length === 0) {
    return [];
  }

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  // Build search query: "handle:foo OR handle:bar OR handle:baz"
  const searchQuery = handles.map((h) => `handle:${h}`).join(" OR ");

  const data = await shopifyFetch<{
    products: { edges: Array<{ node: ShopifyProductCard }> };
  }>({
    operation: "getProductsByHandles",
    query: GET_PRODUCTS_BY_HANDLES_QUERY,
    variables: { query: searchQuery, first: handles.length, country, language },
  });

  const productMap = new Map<string, ShopifyProductCard>();
  for (const edge of data.products.edges) {
    productMap.set(edge.node.handle, edge.node);
  }

  const shopifyProducts = handles
    .map((handle) => productMap.get(handle))
    .filter((product): product is ShopifyProductCard => product !== undefined);

  tagProducts(shopifyProducts);

  return shopifyProducts.map(transformShopifyProductCard);
}
