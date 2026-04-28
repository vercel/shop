import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { PageInfo, ProductCard, ProductDetails } from "@/lib/types";

import { shopifyFetch } from "../fetch";
import { PRODUCT_CARD_FRAGMENT, PRODUCT_FRAGMENT } from "../fragments";
import {
  type ShopifyProduct,
  type ShopifyProductCard,
  transformShopifyProductCard,
  transformShopifyProductDetails,
} from "../transforms/product";
import type { ProductFilter, ShopifyFilter } from "../types/filters";
import { getNumericShopifyId } from "../utils";

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

export async function getProduct(handle: string, locale: string = defaultLocale) {
  "use cache: remote";
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
    throw new Error(`Product not found: ${handle}`);
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
  query searchProducts($query: String!, $first: Int!, $after: String, $sortKey: SearchSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    search(
      query: $query
      first: $first
      after: $after
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

// Translates ProductFilter[] (from URL params) into Shopify's product-query syntax.
// `productFilters` on Search only affects facet counts; QueryRoot.products has no
// equivalent arg, so structured filters are encoded into the `query` string instead.
// variantOption / productMetafield filters have no product-query syntax and are dropped.
function buildCatalogQuery(args: {
  query?: string;
  collection?: string;
  filters: ProductFilter[];
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

export async function getCatalogProducts(params: {
  query?: string;
  collection?: string;
  sortKey?: string;
  limit?: number;
  cursor?: string;
  filters?: ProductFilter[];
  locale?: string;
}): Promise<{
  products: ProductCard[];
  pageInfo: PageInfo;
}> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const {
    query,
    collection,
    sortKey: rawSortKey = "best-matches",
    limit = 50,
    cursor,
    filters = [],
    locale = defaultLocale,
  } = params;

  const sortConfig = CATALOG_SORT_KEY_MAP[rawSortKey] ?? CATALOG_SORT_KEY_MAP["best-matches"];
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const catalogQuery = buildCatalogQuery({ query, collection, filters });

  // RELEVANCE only orders results meaningfully when there's a query string;
  // fall back to TITLE for plain catalog browse.
  const sortKey =
    sortConfig.sortKey === "RELEVANCE" && !catalogQuery ? "TITLE" : sortConfig.sortKey;

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
    products: shopifyProducts.map(transformShopifyProductCard),
    pageInfo: data.products.pageInfo,
  };
}

export async function getSearchFacets(params: {
  query?: string;
  collection?: string;
  filters?: ProductFilter[];
  locale?: string;
}): Promise<{ filters: ShopifyFilter[]; total: number }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const { query, collection, filters = [], locale = defaultLocale } = params;
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

  return {
    filters: data.search.productFilters,
    total: data.search.totalCount,
  };
}

// Index-based search; ranks by relevance over the search index. Reserved for
// callers that genuinely want search semantics (the AI agent tool). Catalog
// browse and the /search page should use getCatalogProducts instead.
export async function searchIndexProducts(params: {
  query: string;
  sortKey?: string;
  limit?: number;
  locale?: string;
}): Promise<{ products: ProductCard[]; total: number }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  const {
    query,
    sortKey: rawSortKey = "best-matches",
    limit = 50,
    locale = defaultLocale,
  } = params;

  const sortConfig = SEARCH_SORT_KEY_MAP[rawSortKey] ?? SEARCH_SORT_KEY_MAP["best-matches"];
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<{
    search: {
      totalCount: number;
      edges: Array<{ node: ShopifyProductCard | null }>;
    };
  }>({
    operation: "searchProducts",
    query: PRODUCTS_SEARCH_QUERY,
    variables: {
      query: query.trim() || "*",
      first: limit,
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
  collection: string;
  limit?: number;
  sortKey?: string;
  cursor?: string;
  filters?: ProductFilter[];
  locale?: string;
}): Promise<{
  products: ProductCard[];
  pageInfo: PageInfo;
  filters: ShopifyFilter[];
}> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "collections", `collection-${params.collection}`);

  const {
    collection,
    sortKey: rawSortKey = "best-matches",
    limit = 50,
    cursor,
    filters = [],
    locale = defaultLocale,
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
      products: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      filters: [],
    };
  }

  const shopifyProducts = data.collection.products.edges.map((edge) => edge.node);

  tagProducts(shopifyProducts);

  const products = shopifyProducts.map(transformShopifyProductCard);

  return {
    products,
    pageInfo: data.collection.products.pageInfo,
    filters: data.collection.products.filters,
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

export async function getProductRecommendations(
  handle: string,
  locale: string = defaultLocale,
): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${handle}`);

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const product = await getProduct(handle, locale);
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
  ${PRODUCT_FRAGMENT}
  query getProductById($id: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    node(id: $id) {
      ... on Product {
        ...ProductFields
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

export async function getProductById(
  id: string,
  locale: string = defaultLocale,
): Promise<ProductDetails> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `product-id-${id}`);

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
    throw new Error(`Product not found: ${id}`);
  }

  tagProducts([product]);

  return transformShopifyProductDetails(product);
}

/** Results are returned in the same order as the input IDs. */
export async function getProductsByIds(
  ids: string[],
  locale: string = defaultLocale,
): Promise<ProductCard[]> {
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
export async function getProductsByHandles(
  handles: string[],
  locale: string = defaultLocale,
): Promise<ProductCard[]> {
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
