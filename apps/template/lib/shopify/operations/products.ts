import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { PageInfo, ProductCard, ProductDetails } from "@/lib/types";

import { shopifyFetch } from "../client";
import { PRODUCT_CARD_FRAGMENT, PRODUCT_FRAGMENT } from "../fragments";
import {
  type ShopifyProduct,
  type ShopifyProductCard,
  transformShopifyProductCard,
  transformShopifyProductDetails,
} from "../transforms/product";
import type { ProductFilter, ShopifyFilter } from "../types/filters";
import { getNumericShopifyId } from "../utils";

/**
 * Generate a `product-{numericId}` cache tag for a Shopify product GID.
 * Returns `null` if the numeric ID cannot be extracted.
 */
function productIdTag(gid: string): string | null {
  const numericId = getNumericShopifyId(gid);
  return numericId ? `product-${numericId}` : null;
}

/**
 * Call `cacheTag` for each product in a list, using their numeric Shopify IDs.
 */
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

const PRODUCTS_SEARCH_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query searchProducts($query: String!, $first: Int!, $after: String, $sortKey: SearchSortKeys, $reverse: Boolean, $productFilters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    search(
      query: $query
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      productFilters: $productFilters
      types: PRODUCT
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

// SearchSortKeys only supports PRICE and RELEVANCE.
// TITLE is not a valid SearchSortKeys value, so name-based sorts fall back to RELEVANCE.
const SEARCH_SORT_KEY_MAP: Record<string, { sortKey: string; reverse: boolean }> = {
  "best-matches": { sortKey: "RELEVANCE", reverse: false },
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "product-name-ascending": { sortKey: "RELEVANCE", reverse: false },
  "product-name-descending": { sortKey: "RELEVANCE", reverse: false },
  TITLE: { sortKey: "RELEVANCE", reverse: false },
  PRICE: { sortKey: "PRICE", reverse: false },
  RELEVANCE: { sortKey: "RELEVANCE", reverse: false },
};

function buildShopifySearchQuery(query?: string, collection?: string): string {
  const queryParts: string[] = [];

  if (query?.trim()) {
    queryParts.push(query.trim());
  }

  if (collection) {
    const safeCollection = collection.replace(/'/g, "\\'");
    queryParts.push(`collection:'${safeCollection}'`);
  }

  return queryParts.length > 0 ? queryParts.join(" AND ") : "*";
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

export async function getProducts(params: {
  query?: string;
  collection?: string;
  sortKey?: string;
  limit?: number;
  cursor?: string;
  filtersJson?: string;
  locale?: string;
}): Promise<{
  products: ProductCard[];
  total: number;
  pageInfo: PageInfo;
  filters: ShopifyFilter[];
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
    filtersJson,
    locale = defaultLocale,
  } = params;
  const filters: ProductFilter[] = filtersJson ? JSON.parse(filtersJson) : [];

  const sortConfig = SEARCH_SORT_KEY_MAP[rawSortKey] ?? SEARCH_SORT_KEY_MAP["best-matches"];
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const searchQuery = buildShopifySearchQuery(query, collection);

  const data = await shopifyFetch<{
    search: {
      totalCount: number;
      productFilters: ShopifyFilter[];
      edges: Array<{ node: ShopifyProductCard | null }>;
      pageInfo: PageInfo;
    };
  }>({
    operation: "searchProducts",
    query: PRODUCTS_SEARCH_QUERY,
    variables: {
      query: searchQuery,
      first: limit,
      after: cursor,
      sortKey: sortConfig.sortKey,
      reverse: sortConfig.reverse,
      productFilters: filters.length > 0 ? filters : undefined,
      country,
      language,
    },
  });

  const shopifyProducts = data.search.edges
    .map((edge) => edge.node)
    .filter((node): node is ShopifyProductCard => node !== null);

  tagProducts(shopifyProducts);

  const products = shopifyProducts.map(transformShopifyProductCard);

  return {
    products,
    total: data.search.totalCount,
    pageInfo: data.search.pageInfo,
    filters: data.search.productFilters,
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
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "product-name-ascending": { sortKey: "TITLE", reverse: false },
  "product-name-descending": { sortKey: "TITLE", reverse: true },
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
  filtersJson?: string;
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
    filtersJson,
    locale = defaultLocale,
  } = params;
  const filters: ProductFilter[] = filtersJson ? JSON.parse(filtersJson) : [];

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

/**
 * Decode a Shopify ID from base64 to GID format if needed.
 * Handles both base64-encoded IDs and raw GIDs.
 */
function decodeShopifyId(id: string): string {
  if (id.startsWith("gid://")) {
    return id;
  }
  return Buffer.from(id, "base64").toString("utf-8");
}

/**
 * Fetch a single product by its Shopify ID (GID or base64-encoded).
 */
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

/**
 * Fetch multiple products by their Shopify IDs (GID or base64-encoded) in a single request.
 * Results are returned in the same order as the input IDs.
 */
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

/**
 * Fetch multiple products by their handles in a single request.
 * Uses Shopify's products query with handle filter.
 * Results are reordered to match the input handle order.
 */
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

  // Create a map for O(1) lookup by handle
  const productMap = new Map<string, ShopifyProductCard>();
  for (const edge of data.products.edges) {
    productMap.set(edge.node.handle, edge.node);
  }

  // Return products in the original handle order, filtering out missing
  const shopifyProducts = handles
    .map((handle) => productMap.get(handle))
    .filter((product): product is ShopifyProductCard => product !== undefined);

  tagProducts(shopifyProducts);

  return shopifyProducts.map(transformShopifyProductCard);
}
