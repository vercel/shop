import { cacheLife, cacheTag } from "next/cache";

import { pdp } from "@/lib/config";
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

import { assertStorefrontOk } from "../errors";
import {
  type ActiveFilters,
  type CollectionProductsParams,
  type CollectionProductsResult,
  escapeProductQuery,
  fetchCollectionProducts,
  fetchProductRecommendationSets,
  fetchProductWithVariants,
  fetchSearchIndexProducts,
  type ProductRecommendationSets,
  type SearchIndexProductsParams,
  type SearchIndexProductsResult,
} from "../fetch";
import {
  IMAGE_FRAGMENT,
  METAFIELD_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_FRAGMENT,
  PRODUCT_WITH_VARIANTS_FRAGMENT,
  PURCHASABLE_PRODUCT_VARIANT_FRAGMENT,
} from "../fragments";
import { storefront } from "../storefront";
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

export {
  fetchCollectionProducts,
  fetchProductRecommendationSets,
  fetchProductWithVariants,
  fetchSearchIndexProducts,
} from "../fetch";

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

const GET_PRODUCT_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query getProductByHandle($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductFields
    }
  }
` as const;

// Metafield identifiers stay variables so the document remains codegen-validatable.
const GET_PRODUCT_BY_HANDLE_WITH_METAFIELDS_QUERY = `#graphql
  ${METAFIELD_FRAGMENT}
  ${PRODUCT_FRAGMENT}
  query getProductByHandleWithMetafields($handle: String!, $metafieldIdentifiers: [HasMetafieldsIdentifier!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductFields
      metafields(identifiers: $metafieldIdentifiers) {
        ...MetafieldFields
      }
    }
  }
` as const;

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

  const response = pdp.specifications.metafields.length
    ? await storefront.request<{ productByHandle: ShopifyProduct }>(
        GET_PRODUCT_BY_HANDLE_WITH_METAFIELDS_QUERY,
        {
          variables: {
            handle,
            metafieldIdentifiers: pdp.specifications.metafields,
            country,
            language,
          },
        },
      )
    : await storefront.request<{ productByHandle: ShopifyProduct }>(GET_PRODUCT_BY_HANDLE_QUERY, {
        variables: { handle, country, language },
      });
  assertStorefrontOk(response, "getProductByHandle");
  const { data } = response;

  if (!data.productByHandle) {
    return undefined;
  }

  tagProducts([data.productByHandle]);

  return transformShopifyProductDetails(data.productByHandle);
}

const GET_PRODUCT_VARIANT_QUERY = `#graphql
  ${IMAGE_FRAGMENT}
  ${PURCHASABLE_PRODUCT_VARIANT_FRAGMENT}
  query getProductVariant($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...PurchasableProductVariantFields
      }
    }
  }
` as const;

// Empty selections intentionally resolve Shopify's first available variant.
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

  const response = await storefront.request<{
    productByHandle: { selectedOrFirstAvailableVariant: ShopifyVariant | null } | null;
  }>(GET_PRODUCT_VARIANT_QUERY, {
    variables: { handle, selectedOptions, country, language },
  });
  assertStorefrontOk(response, "getProductVariant");
  const { data } = response;

  const variant = data.productByHandle?.selectedOrFirstAvailableVariant;
  return variant ? transformVariant(variant) : undefined;
}

export async function getProductWithVariants(params: {
  handle: string;
  locale?: string;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${params.handle}`);

  const product = await fetchProductWithVariants(params);
  if (product) tagProducts([product]);
  return product;
}

const CATALOG_PRODUCTS_QUERY = `#graphql
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
` as const;

const SEARCH_FACETS_QUERY = `#graphql
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
        presentation
        values {
          id
          label
          count
          input
          swatch {
            color
            image {
              previewImage {
                url
              }
            }
          }
        }
      }
    }
  }
` as const;

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

  const response = await storefront.request<{
    products: {
      edges: Array<{ cursor: string; node: ShopifyProductCard | null }>;
      pageInfo: PageInfo;
    };
  }>(CATALOG_PRODUCTS_QUERY, {
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
  assertStorefrontOk(response, "catalogProducts");
  const { data } = response;

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

type SearchFacetsParams = {
  activeFilters?: ActiveFilters;
  collection?: string;
  filters?: ProductFilter[];
  locale?: string;
  query?: string;
};

type SearchFacetsResult = { filters: Filter[]; priceRange?: PriceRange; total: number };

// Browse facets stay uncached so Search & Discovery changes appear immediately.
export async function fetchSearchFacets(params: SearchFacetsParams): Promise<SearchFacetsResult> {
  const { activeFilters = {}, collection, filters = [], locale = defaultLocale, query } = params;
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const queryParts: string[] = [];
  if (query?.trim()) queryParts.push(query.trim());
  if (collection) queryParts.push(`collection:'${escapeProductQuery(collection)}'`);
  const searchQuery = queryParts.length > 0 ? queryParts.join(" AND ") : "*";

  const response = await storefront.request<{
    search: {
      totalCount: number;
      productFilters: ShopifyFilter[];
    };
  }>(SEARCH_FACETS_QUERY, {
    variables: {
      query: searchQuery,
      productFilters: filters.length > 0 ? filters : undefined,
      country,
      language,
    },
  });
  assertStorefrontOk(response, "searchFacets");
  const { data } = response;

  const transformed = transformShopifyFilters(data.search.productFilters, { activeFilters });

  return {
    filters: transformed.filters,
    priceRange: transformed.priceRange,
    total: data.search.totalCount,
  };
}

export async function getSearchFacets(params: SearchFacetsParams): Promise<SearchFacetsResult> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products");

  return fetchSearchFacets(params);
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

// Both intents share one request and both invalidation tags.
export async function getProductRecommendationSets(params: {
  handle: string;
  locale?: string;
}): Promise<ProductRecommendationSets> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `complementary-${params.handle}`, `recommendations-${params.handle}`);

  const sets = await fetchProductRecommendationSets(params);
  tagProducts([...sets.complementary, ...sets.related]);
  return sets;
}

const GET_PRODUCTS_BY_HANDLES_QUERY = `#graphql
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
` as const;

const GET_PRODUCT_BY_ID_QUERY = `#graphql
  ${PRODUCT_WITH_VARIANTS_FRAGMENT}
  query getProductById($id: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    node(id: $id) {
      ... on Product {
        ...ProductWithVariantsFields
      }
    }
  }
` as const;

const GET_PRODUCTS_BY_IDS_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query getProductsByIds($ids: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductCardFields
      }
    }
  }
` as const;

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

  const response = await storefront.request<{ node: ShopifyProduct | null }>(
    GET_PRODUCT_BY_ID_QUERY,
    {
      variables: { id: gid, country, language },
    },
  );
  assertStorefrontOk(response, "getProductById");
  const { data } = response;

  const product = data.node;
  if (!product) {
    return undefined;
  }

  cacheTag(`product-${product.handle}`);
  tagProducts([product]);

  return transformShopifyProductDetails(product);
}

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

  const response = await storefront.request<{ nodes: (ShopifyProductCard | null)[] }>(
    GET_PRODUCTS_BY_IDS_QUERY,
    {
      variables: { ids: gids, country, language },
    },
  );
  assertStorefrontOk(response, "getProductsByIds");
  const { data } = response;

  const shopifyProducts = data.nodes.filter((node): node is ShopifyProductCard => node !== null);

  tagProducts(shopifyProducts);

  return shopifyProducts.map(transformShopifyProductCard);
}

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

  const searchQuery = handles.map((h) => `handle:${h}`).join(" OR ");

  const response = await storefront.request<{
    products: { edges: Array<{ node: ShopifyProductCard }> };
  }>(GET_PRODUCTS_BY_HANDLES_QUERY, {
    variables: { query: searchQuery, first: handles.length, country, language },
  });
  assertStorefrontOk(response, "getProductsByHandles");
  const { data } = response;

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
