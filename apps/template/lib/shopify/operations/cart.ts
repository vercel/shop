import { cache } from "react";

import { getCartIdFromCookie, invalidateCartCache, setCartIdCookie } from "@/lib/cart/server";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Cart } from "@/lib/types";

import { assertStorefrontOk, type CartMutationPayload } from "../errors";
import {
  addToCartCore,
  applyCartMutation,
  type CartLineInput,
  type CartMutationResult,
  createCartCore,
  fetchCart,
  removeFromCartCore,
  updateCartCore,
  updateCartNoteCore,
} from "../fetch";
import { CART_FRAGMENT } from "../fragments";
import { storefront } from "../storefront";
import type { ShopifyCart } from "../transforms/cart";

export type { CartLineInput, CartMutationResult };

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

/** Request-deduped via React.cache so every server boundary in a render shares one fetch. */
export const getCart = cache(async (): Promise<Cart | undefined> => {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return undefined;
  return getCartById(cartId);
});

export async function getCartById(cartId: string): Promise<Cart | undefined> {
  return fetchCart(cartId);
}

/**
 * Use in streaming contexts (e.g., the AI agent) where `cookies().set()` won't work.
 * The caller is responsible for setting the cookie via response headers.
 */
export async function createCartWithoutCookie(
  locale: string = defaultLocale,
): Promise<CartMutationResult> {
  const result = await createCartCore(locale);
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

export async function addToCart(
  lines: CartLineInput[],
  cartId?: string,
  locale: string = defaultLocale,
): Promise<CartMutationResult> {
  let resolvedCartId = cartId ?? (await getCartIdFromCookie());
  if (!resolvedCartId) {
    resolvedCartId = (await createCart(locale)).cart.id;
  }
  if (!resolvedCartId) throw new Error("Cart ID not found");

  const result = await addToCartCore(lines, resolvedCartId);
  invalidateCartCache();
  return result;
}

export async function updateCart(
  lines: { id: string; quantity: number }[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  const result = await updateCartCore(lines, cartId);
  invalidateCartCache();
  return result;
}

export async function removeFromCart(
  lineIds: string[],
  cartIdOverride?: string,
): Promise<CartMutationResult> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) throw new Error("Cart ID not found");

  const result = await removeFromCartCore(lineIds, cartId);
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

  const result = applyCartMutation(
    response.data.cartBuyerIdentityUpdate,
    "cartBuyerIdentityUpdate",
  );
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

  const result = applyCartMutation(
    response.data.cartBuyerIdentityUpdate,
    "cartBuyerIdentityUpdate",
  );
  invalidateCartCache();
  return result;
}

export async function updateCartNote(
  note: string,
  cartIdOverride?: string,
): Promise<CartMutationResult | undefined> {
  const cartId = cartIdOverride || (await getCartIdFromCookie());
  if (!cartId) return undefined;

  const result = await updateCartNoteCore(note, cartId);
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

  const result = applyCartMutation(
    response.data.cartDiscountCodesUpdate,
    "cartDiscountCodesUpdate",
  );
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

  const result = applyCartMutation(
    response.data.cartDeliveryAddressesAdd,
    "cartDeliveryAddressesAdd",
  );
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

  const result = applyCartMutation(
    response.data.cartDeliveryAddressesUpdate,
    "cartDeliveryAddressesUpdate",
  );
  invalidateCartCache();
  return result;
}
