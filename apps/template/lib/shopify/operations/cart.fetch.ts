// Next-free cart mutation cores: storefront.request + transform, no cookies and
// no "next/cache". Each takes an explicit cartId (the wrappers in ./cart.ts add
// cookie resolution + invalidateCartCache). eve agent tools import these because
// eve's runtime has neither next/headers cookies nor the Next cache.
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Cart, CartWarning } from "@/lib/types";

import { assertStorefrontOk, type CartMutationPayload, unwrapCartMutation } from "../errors";
import { CART_FRAGMENT } from "../fragments";
import { storefront } from "../storefront.core";
import { type ShopifyCart, transformShopifyCart } from "../transforms/cart";

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

export type CartMutationResult = { cart: Cart; warnings: CartWarning[] };

// Shopify's CartLineInput. `parent` links a line to a bundle/add-on parent.
export interface CartLineInput {
  merchandiseId: string;
  parent?: { lineId?: string; merchandiseId?: string };
  quantity: number;
}

function applyMutation(
  payload: CartMutationPayload<ShopifyCart>,
  operation: string,
): CartMutationResult {
  const { cart, warnings } = unwrapCartMutation(payload, operation);
  return { cart: transformShopifyCart(cart), warnings };
}

export async function fetchCart(cartId: string): Promise<Cart | undefined> {
  const response = await storefront.request<{ cart: ShopifyCart | null }>(GET_CART_QUERY, {
    variables: { cartId },
  });
  assertStorefrontOk(response, "getCart");
  return response.data.cart ? transformShopifyCart(response.data.cart) : undefined;
}

export async function createCartCore(locale: string = defaultLocale): Promise<CartMutationResult> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{ cartCreate: CartMutationPayload<ShopifyCart> }>(
    CART_CREATE_MUTATION,
    { variables: { input: { buyerIdentity: { countryCode: country } }, country, language } },
  );
  assertStorefrontOk(response, "cartCreate");
  return applyMutation(response.data.cartCreate, "cartCreate");
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
  return applyMutation(response.data.cartLinesAdd, "cartLinesAdd");
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
  return applyMutation(response.data.cartLinesUpdate, "cartLinesUpdate");
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
  return applyMutation(response.data.cartLinesRemove, "cartLinesRemove");
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
  return applyMutation(response.data.cartNoteUpdate, "cartNoteUpdate");
}
