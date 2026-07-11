import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type {
  Cart,
  CartWarning,
  Collection,
  Filter,
  PageInfo,
  PriceRange,
  ProductCard,
  ProductDetails,
} from "@/lib/types";

import { assertStorefrontOk, type CartMutationPayload, unwrapCartMutation } from "./errors";
import {
  CART_FRAGMENT,
  COLLECTION_FIELDS_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_WITH_VARIANTS_FRAGMENT,
} from "./fragments";
import { storefront } from "./storefront";
import { type ShopifyCart, transformShopifyCart } from "./transforms/cart";
import { type ShopifyCollection, transformShopifyCollections } from "./transforms/collection";
import { transformShopifyFilters } from "./transforms/filters";
import {
  type ShopifyProduct,
  type ShopifyProductCard,
  transformShopifyProductCard,
  transformShopifyProductDetails,
} from "./transforms/product";
import type { ProductFilter, ShopifyFilter } from "./types/filters";

export type ActiveFilters = Record<string, string | string[] | undefined>;

export function escapeProductQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

// SearchSortKeys only supports PRICE and RELEVANCE — used by the AI agent text-search path.
const SEARCH_SORT_KEY_MAP: Record<string, { sortKey: string; reverse: boolean }> = {
  "best-matches": { sortKey: "RELEVANCE", reverse: false },
  "price-high-to-low": { sortKey: "PRICE", reverse: true },
  "price-low-to-high": { sortKey: "PRICE", reverse: false },
  PRICE: { sortKey: "PRICE", reverse: false },
  RELEVANCE: { sortKey: "RELEVANCE", reverse: false },
};

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

const PRODUCTS_SEARCH_QUERY = `#graphql
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
` as const;

const COLLECTION_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query collectionProducts($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
        filters {
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
` as const;

const GET_PRODUCT_WITH_VARIANTS_QUERY = `#graphql
  ${PRODUCT_WITH_VARIANTS_FRAGMENT}
  query getProductWithVariants($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      ...ProductWithVariantsFields
    }
  }
` as const;

const COMPLEMENTARY_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query complementaryProducts($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productRecommendations(productHandle: $handle, intent: COMPLEMENTARY) {
      ...ProductCardFields
    }
  }
` as const;

const RELATED_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query relatedProducts($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productRecommendations(productHandle: $handle, intent: RELATED) {
      ...ProductCardFields
    }
  }
` as const;

const GET_COLLECTIONS_QUERY = `#graphql
  ${COLLECTION_FIELDS_FRAGMENT}
  query getCollections($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collections(first: $first) {
      edges {
        node {
          ...CollectionFields
        }
      }
    }
  }
` as const;

const GET_CART_QUERY = `#graphql
  ${CART_FRAGMENT}
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
` as const;

const CART_CREATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartCreate($input: CartInput, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
      warnings { code message target }
    }
  }
` as const;

const CART_LINES_ADD_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
      warnings { code message target }
    }
  }
` as const;

const CART_LINES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
      warnings { code message target }
    }
  }
` as const;

const CART_LINES_REMOVE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
      warnings { code message target }
    }
  }
` as const;

const CART_NOTE_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartNoteUpdate($cartId: ID!, $note: String!) {
    cartNoteUpdate(cartId: $cartId, note: $note) {
      cart { ...CartFields }
      userErrors { field message }
      warnings { code message target }
    }
  }
` as const;

export type SearchIndexProductsParams = {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  query?: string;
  sortKey?: string;
};

export type SearchIndexProductsResult = {
  pageInfo: PageInfo;
  products: ProductCard[];
  total: number;
};

export type CollectionProductsParams = {
  activeFilters?: ActiveFilters;
  collection: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: string;
  sortKey?: string;
};

export type CollectionProductsResult = {
  filters: Filter[];
  pageInfo: PageInfo;
  priceRange?: PriceRange;
  products: ProductCard[];
};

export type CartMutationResult = { cart: Cart; warnings: CartWarning[] };

export interface CartLineInput {
  merchandiseId: string;
  parent?: { lineId?: string; merchandiseId?: string };
  quantity: number;
}

export function applyCartMutation(
  payload: CartMutationPayload<ShopifyCart>,
  operation: string,
): CartMutationResult {
  const { cart, warnings } = unwrapCartMutation(payload, operation);
  return { cart: transformShopifyCart(cart), warnings };
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

  const response = await storefront.request<{
    search: {
      totalCount: number;
      edges: Array<{ cursor: string; node: ShopifyProductCard | null }>;
      pageInfo: PageInfo;
    };
  }>(PRODUCTS_SEARCH_QUERY, {
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
  assertStorefrontOk(response, "searchProducts");
  const { data } = response;

  const shopifyProducts = data.search.edges
    .map((edge) => edge.node)
    .filter((node): node is ShopifyProductCard => node !== null);

  return {
    pageInfo: data.search.pageInfo,
    products: shopifyProducts.map(transformShopifyProductCard),
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
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{
    collection: {
      products: {
        edges: Array<{ node: ShopifyProductCard }>;
        pageInfo: PageInfo;
        filters: ShopifyFilter[];
      };
    } | null;
  }>(COLLECTION_PRODUCTS_QUERY, {
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
  assertStorefrontOk(response, "collectionProducts");
  const { data } = response;

  if (!data.collection) {
    return {
      filters: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
      products: [],
    };
  }

  const shopifyProducts = data.collection.products.edges.map((edge) => edge.node);
  const products = shopifyProducts.map(transformShopifyProductCard);
  const transformed = transformShopifyFilters(data.collection.products.filters, { activeFilters });

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
  locale?: string;
}): Promise<ProductDetails | undefined> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{ productByHandle: ShopifyProduct }>(
    GET_PRODUCT_WITH_VARIANTS_QUERY,
    { variables: { handle, country, language } },
  );
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
  locale?: string;
}): Promise<ProductCard[]> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{
    productRecommendations: ShopifyProductCard[] | null;
  }>(COMPLEMENTARY_PRODUCTS_QUERY, { variables: { country, handle, language } });
  assertStorefrontOk(response, "complementaryProducts");

  return (response.data.productRecommendations ?? []).map(transformShopifyProductCard);
}

export async function fetchRelatedProducts({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<ProductCard[]> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{
    productRecommendations: ShopifyProductCard[] | null;
  }>(RELATED_PRODUCTS_QUERY, { variables: { country, handle, language } });
  assertStorefrontOk(response, "relatedProducts");

  return (response.data.productRecommendations ?? []).map(transformShopifyProductCard);
}

export async function fetchCollections({
  limit = 250,
  locale = defaultLocale,
}: { limit?: number; locale?: string } = {}): Promise<Collection[]> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{
    collections: { edges: Array<{ node: ShopifyCollection }> };
  }>(GET_COLLECTIONS_QUERY, { variables: { first: limit, country, language } });
  assertStorefrontOk(response, "getCollections");

  return transformShopifyCollections(response.data.collections.edges.map((edge) => edge.node));
}

export async function fetchCart(cartId: string): Promise<Cart | undefined> {
  const response = await storefront.request<{ cart: ShopifyCart | null }>(GET_CART_QUERY, {
    variables: { cartId },
  });
  assertStorefrontOk(response, "getCart");
  return response.data.cart ? transformShopifyCart(response.data.cart) : undefined;
}

const NODE_HANDLES_QUERY = `#graphql
  query nodeHandles($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        handle
      }
    }
  }
` as const;

export async function fetchProductHandlesByIds(ids: string[]): Promise<Map<string, string>> {
  const handles = new Map<string, string>();
  if (ids.length === 0) return handles;

  const response = await storefront.request<{
    nodes: Array<{ handle: string; id: string } | null>;
  }>(NODE_HANDLES_QUERY, { variables: { ids } });
  assertStorefrontOk(response, "nodeHandles");

  for (const node of response.data.nodes) {
    if (node?.id && node.handle) handles.set(node.id, node.handle);
  }
  return handles;
}

export async function createCartCore(locale: string = defaultLocale): Promise<CartMutationResult> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{ cartCreate: CartMutationPayload<ShopifyCart> }>(
    CART_CREATE_MUTATION,
    { variables: { input: { buyerIdentity: { countryCode: country } }, country, language } },
  );
  assertStorefrontOk(response, "cartCreate");
  return applyCartMutation(response.data.cartCreate, "cartCreate");
}

export async function addToCartCore(
  lines: CartLineInput[],
  cartId: string,
): Promise<CartMutationResult> {
  const response = await storefront.request<{ cartLinesAdd: CartMutationPayload<ShopifyCart> }>(
    CART_LINES_ADD_MUTATION,
    { variables: { cartId, lines } },
  );
  assertStorefrontOk(response, "cartLinesAdd");
  return applyCartMutation(response.data.cartLinesAdd, "cartLinesAdd");
}

export async function updateCartCore(
  lines: { id: string; quantity: number }[],
  cartId: string,
): Promise<CartMutationResult> {
  const response = await storefront.request<{ cartLinesUpdate: CartMutationPayload<ShopifyCart> }>(
    CART_LINES_UPDATE_MUTATION,
    { variables: { cartId, lines } },
  );
  assertStorefrontOk(response, "cartLinesUpdate");
  return applyCartMutation(response.data.cartLinesUpdate, "cartLinesUpdate");
}

export async function removeFromCartCore(
  lineIds: string[],
  cartId: string,
): Promise<CartMutationResult> {
  const response = await storefront.request<{ cartLinesRemove: CartMutationPayload<ShopifyCart> }>(
    CART_LINES_REMOVE_MUTATION,
    { variables: { cartId, lineIds } },
  );
  assertStorefrontOk(response, "cartLinesRemove");
  return applyCartMutation(response.data.cartLinesRemove, "cartLinesRemove");
}

export async function updateCartNoteCore(
  note: string,
  cartId: string,
): Promise<CartMutationResult> {
  const response = await storefront.request<{ cartNoteUpdate: CartMutationPayload<ShopifyCart> }>(
    CART_NOTE_UPDATE_MUTATION,
    { variables: { cartId, note } },
  );
  assertStorefrontOk(response, "cartNoteUpdate");
  return applyCartMutation(response.data.cartNoteUpdate, "cartNoteUpdate");
}
