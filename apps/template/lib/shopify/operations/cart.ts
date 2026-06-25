import { getCartIdFromCookie, invalidateCartCache, setCartIdCookie } from "@/lib/cart/server";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Cart, CartWarning } from "@/lib/types";

import { assertStorefrontOk, type CartMutationPayload, unwrapCartMutation } from "../errors";
import { CART_FRAGMENT } from "../fragments";
import { storefront } from "../storefront";
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
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const CART_LINES_ADD_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const CART_LINES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const CART_LINES_REMOVE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const CART_BUYER_IDENTITY_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const CART_NOTE_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartNoteUpdate($cartId: ID!, $note: String!) {
    cartNoteUpdate(cartId: $cartId, note: $note) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const CART_DISCOUNT_CODES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const GET_CART_SELECTABLE_ADDRESSES_QUERY = `#graphql
  query getCartSelectableAddresses($cartId: ID!) {
    cart(id: $cartId) {
      delivery {
        addresses {
          id
        }
      }
    }
  }
` as const;

const CART_DELIVERY_ADDRESSES_ADD_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartDeliveryAddressesAdd($cartId: ID!, $addresses: [CartSelectableAddressInput!]!) {
    cartDeliveryAddressesAdd(cartId: $cartId, addresses: $addresses) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

const GET_CART_DELIVERY_OPTIONS_QUERY = `#graphql
  query getCartDeliveryOptions($cartId: ID!) {
    cart(id: $cartId) {
      deliveryGroups(first: 5) {
        nodes {
          deliveryOptions {
            title
            estimatedCost {
              amount
              currencyCode
            }
            deliveryMethodType
          }
        }
      }
    }
  }
` as const;

const CART_DELIVERY_ADDRESSES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation cartDeliveryAddressesUpdate($cartId: ID!, $addresses: [CartSelectableAddressUpdateInput!]!) {
    cartDeliveryAddressesUpdate(cartId: $cartId, addresses: $addresses) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
` as const;

export type CartMutationResult = { cart: Cart; warnings: CartWarning[] };

function applyMutation(
  payload: CartMutationPayload<ShopifyCart>,
  operation: string,
): CartMutationResult {
  const { cart, warnings } = unwrapCartMutation(payload, operation);
  return { cart: transformShopifyCart(cart), warnings };
}

export async function getCart(cartId?: string): Promise<Cart | undefined> {
  if (!cartId) {
    cartId = await getCartIdFromCookie();
  }
  if (!cartId) return undefined;

  const response = await storefront.request<{ cart: ShopifyCart | null }>(GET_CART_QUERY, {
    variables: { cartId },
  });
  assertStorefrontOk(response, "getCart");
  const { data } = response;

  if (!data.cart) return undefined;

  return transformShopifyCart(data.cart);
}

/**
 * Use in streaming contexts (e.g., the AI agent) where `cookies().set()` won't work.
 * The caller is responsible for setting the cookie via response headers.
 */
export async function createCartWithoutCookie(
  locale: string = defaultLocale,
): Promise<CartMutationResult> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const response = await storefront.request<{ cartCreate: CartMutationPayload<ShopifyCart> }>(
    CART_CREATE_MUTATION,
    {
      variables: {
        input: {
          buyerIdentity: {
            countryCode: country,
          },
        },
        country,
        language,
      },
    },
  );
  assertStorefrontOk(response, "cartCreate");

  const result = applyMutation(response.data.cartCreate, "cartCreate");
  invalidateCartCache();
  return result;
}

export async function createCart(locale: string = defaultLocale): Promise<CartMutationResult> {
  const result = await createCartWithoutCookie(locale);

  if (result.cart.id) {
    await setCartIdCookie(result.cart.id);
  }

  return result;
}

// Shopify's CartLineInput. `parent` links a line to a bundle/add-on parent —
// the foundation for app-specific customized bundle flows; the default PDP only
// adds ordinary products and fixed bundle parents directly (no parent).
export interface CartLineInput {
  merchandiseId: string;
  parent?: {
    lineId?: string;
    merchandiseId?: string;
  };
  quantity: number;
}

export async function addToCart(
  lines: CartLineInput[],
  cartId?: string,
  locale: string = defaultLocale,
): Promise<CartMutationResult> {
  if (!cartId) {
    cartId = await getCartIdFromCookie();
  }

  if (!cartId) {
    const created = await createCart(locale);
    cartId = created.cart.id;
  }

  const response = await storefront.request<{ cartLinesAdd: CartMutationPayload<ShopifyCart> }>(
    CART_LINES_ADD_MUTATION,
    {
      variables: { cartId, lines },
    },
  );
  assertStorefrontOk(response, "cartLinesAdd");

  const result = applyMutation(response.data.cartLinesAdd, "cartLinesAdd");
  invalidateCartCache();
  return result;
}

export async function updateCart(
  lines: { id: string; quantity: number }[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  const response = await storefront.request<{
    cartLinesUpdate: CartMutationPayload<ShopifyCart>;
  }>(CART_LINES_UPDATE_MUTATION, {
    variables: {
      cartId,
      lines,
    },
  });
  assertStorefrontOk(response, "cartLinesUpdate");

  const result = applyMutation(response.data.cartLinesUpdate, "cartLinesUpdate");
  invalidateCartCache();
  return result;
}

export async function removeFromCart(
  lineIds: string[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  const response = await storefront.request<{
    cartLinesRemove: CartMutationPayload<ShopifyCart>;
  }>(CART_LINES_REMOVE_MUTATION, {
    variables: { cartId, lineIds },
  });
  assertStorefrontOk(response, "cartLinesRemove");

  const result = applyMutation(response.data.cartLinesRemove, "cartLinesRemove");
  invalidateCartCache();
  return result;
}

export async function updateCartBuyerIdentity(
  locale: string,
  countryCode?: string,
): Promise<CartMutationResult | undefined> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return undefined;

  const country = countryCode ?? getCountryCode(locale);

  const response = await storefront.request<{
    cartBuyerIdentityUpdate: CartMutationPayload<ShopifyCart>;
  }>(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
    variables: {
      cartId,
      buyerIdentity: {
        countryCode: country,
      },
    },
  });
  assertStorefrontOk(response, "cartBuyerIdentityUpdate");

  const result = applyMutation(response.data.cartBuyerIdentityUpdate, "cartBuyerIdentityUpdate");
  invalidateCartCache();
  return result;
}

export async function linkCartToCustomer(
  customerAccessToken: string,
  cartIdOverride?: string,
): Promise<CartMutationResult | undefined> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) return undefined;

  const response = await storefront.request<{
    cartBuyerIdentityUpdate: CartMutationPayload<ShopifyCart>;
  }>(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
    variables: {
      cartId,
      buyerIdentity: {
        customerAccessToken,
      },
    },
  });
  assertStorefrontOk(response, "cartBuyerIdentityUpdate");

  const result = applyMutation(response.data.cartBuyerIdentityUpdate, "cartBuyerIdentityUpdate");
  invalidateCartCache();
  return result;
}

export async function updateCartNote(
  note: string,
  cartIdOverride?: string,
): Promise<CartMutationResult | undefined> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) return undefined;

  const response = await storefront.request<{
    cartNoteUpdate: CartMutationPayload<ShopifyCart>;
  }>(CART_NOTE_UPDATE_MUTATION, {
    variables: {
      cartId,
      note,
    },
  });
  assertStorefrontOk(response, "cartNoteUpdate");

  const result = applyMutation(response.data.cartNoteUpdate, "cartNoteUpdate");
  invalidateCartCache();
  return result;
}

export async function updateCartDiscountCodes(
  discountCodes: string[],
  cartIdOverride?: string,
): Promise<CartMutationResult | undefined> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) return undefined;

  const response = await storefront.request<{
    cartDiscountCodesUpdate: CartMutationPayload<ShopifyCart>;
  }>(CART_DISCOUNT_CODES_UPDATE_MUTATION, {
    variables: { cartId, discountCodes },
  });
  assertStorefrontOk(response, "cartDiscountCodesUpdate");

  const result = applyMutation(response.data.cartDiscountCodesUpdate, "cartDiscountCodesUpdate");
  invalidateCartCache();
  return result;
}

export async function getCartSelectableAddressId(): Promise<string | undefined> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return undefined;

  const response = await storefront.request<{
    cart: {
      delivery: { addresses: Array<{ id: string }> };
    } | null;
  }>(GET_CART_SELECTABLE_ADDRESSES_QUERY, {
    variables: { cartId },
  });
  assertStorefrontOk(response, "getCartSelectableAddresses");

  return response.data.cart?.delivery?.addresses?.[0]?.id;
}

export async function addCartDeliveryAddress(address: {
  city?: string;
  countryCode: string;
  customerAddressId?: string;
  zip?: string;
}): Promise<CartMutationResult | undefined> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return undefined;

  const addressInput = address.customerAddressId
    ? { copyFromCustomerAddressId: address.customerAddressId }
    : {
        deliveryAddress: {
          city: address.city,
          countryCode: address.countryCode,
          zip: address.zip,
        },
      };

  const response = await storefront.request<{
    cartDeliveryAddressesAdd: CartMutationPayload<ShopifyCart>;
  }>(CART_DELIVERY_ADDRESSES_ADD_MUTATION, {
    variables: {
      cartId,
      addresses: [
        {
          address: addressInput,
          selected: true,
          oneTimeUse: !address.customerAddressId,
          validationStrategy: "COUNTRY_CODE_ONLY",
        },
      ],
    },
  });
  assertStorefrontOk(response, "cartDeliveryAddressesAdd");

  const result = applyMutation(response.data.cartDeliveryAddressesAdd, "cartDeliveryAddressesAdd");
  invalidateCartCache();
  return result;
}

export type CartShippingOption = {
  deliveryMethodType: string;
  estimatedCost: { amount: string; currencyCode: string };
  title: string;
};

export async function getCartDeliveryOptions(): Promise<CartShippingOption[]> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return [];

  const response = await storefront.request<{
    cart: {
      deliveryGroups: {
        nodes: Array<{
          deliveryOptions: Array<{
            deliveryMethodType: string;
            estimatedCost: { amount: string; currencyCode: string };
            title: string | null;
          }>;
        }>;
      };
    } | null;
  }>(GET_CART_DELIVERY_OPTIONS_QUERY, {
    variables: { cartId },
  });
  assertStorefrontOk(response, "getCartDeliveryOptions");
  const { data } = response;

  if (!data.cart) return [];

  const seen = new Set<string>();
  return data.cart.deliveryGroups.nodes
    .flatMap((group) => group.deliveryOptions)
    .filter((opt) => {
      const key = opt.title ?? opt.deliveryMethodType;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((opt) => ({
      deliveryMethodType: opt.deliveryMethodType,
      estimatedCost: opt.estimatedCost,
      title: opt.title ?? opt.deliveryMethodType,
    }));
}

export async function updateCartDeliveryAddress(
  addressId: string,
  address: {
    city?: string;
    countryCode: string;
    customerAddressId?: string;
    zip?: string;
  },
): Promise<CartMutationResult | undefined> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return undefined;

  const addressInput = address.customerAddressId
    ? { copyFromCustomerAddressId: address.customerAddressId }
    : {
        deliveryAddress: {
          city: address.city,
          countryCode: address.countryCode,
          zip: address.zip,
        },
      };

  const response = await storefront.request<{
    cartDeliveryAddressesUpdate: CartMutationPayload<ShopifyCart>;
  }>(CART_DELIVERY_ADDRESSES_UPDATE_MUTATION, {
    variables: {
      cartId,
      addresses: [
        {
          id: addressId,
          address: addressInput,
          selected: true,
          validationStrategy: "COUNTRY_CODE_ONLY",
        },
      ],
    },
  });
  assertStorefrontOk(response, "cartDeliveryAddressesUpdate");

  const result = applyMutation(
    response.data.cartDeliveryAddressesUpdate,
    "cartDeliveryAddressesUpdate",
  );
  invalidateCartCache();
  return result;
}
