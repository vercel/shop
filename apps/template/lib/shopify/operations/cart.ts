import { cookies } from "next/headers";

import { invalidateCartCache } from "@/lib/cart/server";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Cart } from "@/lib/types";

import { type CartMutationPayload, unwrapCartMutation } from "../errors";
import { shopifyFetch } from "../fetch";
import { type ShopifyCart, transformShopifyCart } from "../transforms/cart";

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              image {
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              product {
                id
                title
                handle
                featuredImage {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    deliveryGroups(first: 5) {
      nodes {
        selectedDeliveryOption {
          title
          estimatedCost {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export async function getCart(cartId?: string): Promise<Cart | undefined> {
  if (!cartId) {
    cartId = (await cookies()).get("shopify_cartId")?.value;
  }
  if (!cartId) return undefined;

  const data = await shopifyFetch<{ cart: ShopifyCart | null }>({
    operation: "getCart",
    query: `
      ${CART_FRAGMENT}
      query getCart($cartId: ID!) {
        cart(id: $cartId) {
          ...CartFields
        }
      }
    `,
    variables: { cartId },
  });

  if (!data.cart) return undefined;

  return transformShopifyCart(data.cart);
}

/**
 * Use in streaming contexts (e.g., the AI agent) where `cookies().set()` won't work.
 * The caller is responsible for setting the cookie via response headers.
 */
export async function createCartWithoutCookie(locale: string = defaultLocale): Promise<Cart> {
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<{ cartCreate: CartMutationPayload<ShopifyCart> }>({
    operation: "cartCreate",
    query: `
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
        }
      }
    `,
    variables: {
      input: {
        buyerIdentity: {
          countryCode: country,
        },
      },
      country,
      language,
    },
  });

  const cart = transformShopifyCart(unwrapCartMutation(data.cartCreate, "cartCreate"));
  invalidateCartCache();
  return cart;
}

export async function createCart(locale: string = defaultLocale): Promise<Cart> {
  const cart = await createCartWithoutCookie(locale);

  if (cart.id) {
    (await cookies()).set("shopify_cartId", cart.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }

  return cart;
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
  cartId?: string,
  locale: string = defaultLocale,
): Promise<Cart> {
  if (!cartId) {
    cartId = (await cookies()).get("shopify_cartId")?.value;
  }

  if (!cartId) {
    const cart = await createCart(locale);
    cartId = cart.id;
  }

  const data = await shopifyFetch<{ cartLinesAdd: CartMutationPayload<ShopifyCart> }>({
    operation: "cartLinesAdd",
    query: `
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
        }
      }
    `,
    variables: { cartId, lines },
  });

  const cart = transformShopifyCart(unwrapCartMutation(data.cartLinesAdd, "cartLinesAdd"));
  invalidateCartCache();
  return cart;
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
  cartIdOverride?: string,
): Promise<Cart> {
  const cartId = cartIdOverride || (await cookies()).get("shopify_cartId")?.value;
  if (!cartId) throw new Error("Cart ID not found");

  const data = await shopifyFetch<{
    cartLinesUpdate: CartMutationPayload<ShopifyCart>;
  }>({
    operation: "cartLinesUpdate",
    query: `
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
        }
      }
    `,
    variables: {
      cartId,
      lines: lines.map((line) => ({ id: line.id, quantity: line.quantity })),
    },
  });

  const cart = transformShopifyCart(unwrapCartMutation(data.cartLinesUpdate, "cartLinesUpdate"));
  invalidateCartCache();
  return cart;
}

export async function removeFromCart(lineIds: string[], cartIdOverride?: string): Promise<Cart> {
  const cartId = cartIdOverride || (await cookies()).get("shopify_cartId")?.value;
  if (!cartId) throw new Error("Cart ID not found");

  const data = await shopifyFetch<{
    cartLinesRemove: CartMutationPayload<ShopifyCart>;
  }>({
    operation: "cartLinesRemove",
    query: `
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
        }
      }
    `,
    variables: { cartId, lineIds },
  });

  const cart = transformShopifyCart(unwrapCartMutation(data.cartLinesRemove, "cartLinesRemove"));
  invalidateCartCache();
  return cart;
}

export async function updateCartBuyerIdentity(
  locale: string,
  countryCode?: string,
): Promise<Cart | undefined> {
  const cartId = (await cookies()).get("shopify_cartId")?.value;
  if (!cartId) return undefined;

  const country = countryCode ?? getCountryCode(locale);

  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: CartMutationPayload<ShopifyCart>;
  }>({
    operation: "cartBuyerIdentityUpdate",
    query: `
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
        }
      }
    `,
    variables: {
      cartId,
      buyerIdentity: {
        countryCode: country,
      },
    },
  });

  const cart = transformShopifyCart(
    unwrapCartMutation(data.cartBuyerIdentityUpdate, "cartBuyerIdentityUpdate"),
  );
  invalidateCartCache();
  return cart;
}

export async function linkCartToCustomer(
  customerAccessToken: string,
  cartIdOverride?: string,
): Promise<Cart | undefined> {
  const cartId = cartIdOverride || (await cookies()).get("shopify_cartId")?.value;
  if (!cartId) return undefined;

  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: CartMutationPayload<ShopifyCart>;
  }>({
    operation: "cartBuyerIdentityUpdate",
    query: `
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
        }
      }
    `,
    variables: {
      cartId,
      buyerIdentity: {
        customerAccessToken,
      },
    },
  });

  const cart = transformShopifyCart(
    unwrapCartMutation(data.cartBuyerIdentityUpdate, "cartBuyerIdentityUpdate"),
  );
  invalidateCartCache();
  return cart;
}

export async function updateCartNote(
  note: string,
  cartIdOverride?: string,
): Promise<Cart | undefined> {
  const cartId = cartIdOverride || (await cookies()).get("shopify_cartId")?.value;
  if (!cartId) return undefined;

  const data = await shopifyFetch<{
    cartNoteUpdate: CartMutationPayload<ShopifyCart>;
  }>({
    operation: "cartNoteUpdate",
    query: `
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
        }
      }
    `,
    variables: {
      cartId,
      note,
    },
  });

  const cart = transformShopifyCart(unwrapCartMutation(data.cartNoteUpdate, "cartNoteUpdate"));
  invalidateCartCache();
  return cart;
}

export async function getCartSelectableAddressId(): Promise<string | undefined> {
  const cartId = (await cookies()).get("shopify_cartId")?.value;
  if (!cartId) return undefined;

  const data = await shopifyFetch<{
    cart: {
      selectableAddresses: Array<{ id: string }>;
    } | null;
  }>({
    operation: "getCartSelectableAddresses",
    query: `
      query getCartSelectableAddresses($cartId: ID!) {
        cart(id: $cartId) {
          selectableAddresses {
            id
          }
        }
      }
    `,
    variables: { cartId },
  });

  return data.cart?.selectableAddresses?.[0]?.id;
}

export async function addCartDeliveryAddress(address: {
  city?: string;
  countryCode: string;
  zip?: string;
  customerAddressId?: string;
}): Promise<Cart | undefined> {
  const cartId = (await cookies()).get("shopify_cartId")?.value;
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

  const data = await shopifyFetch<{
    cartDeliveryAddressesAdd: CartMutationPayload<ShopifyCart>;
  }>({
    operation: "cartDeliveryAddressesAdd",
    query: `
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
        }
      }
    `,
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

  const cart = transformShopifyCart(
    unwrapCartMutation(data.cartDeliveryAddressesAdd, "cartDeliveryAddressesAdd"),
  );
  invalidateCartCache();
  return cart;
}

export type CartShippingOption = {
  title: string;
  estimatedCost: { amount: string; currencyCode: string };
  deliveryMethodType: string;
};

export async function getCartDeliveryOptions(): Promise<CartShippingOption[]> {
  const cartId = (await cookies()).get("shopify_cartId")?.value;
  if (!cartId) return [];

  const data = await shopifyFetch<{
    cart: {
      deliveryGroups: {
        nodes: Array<{
          deliveryOptions: Array<{
            title: string | null;
            estimatedCost: { amount: string; currencyCode: string };
            deliveryMethodType: string;
          }>;
        }>;
      };
    } | null;
  }>({
    operation: "getCartDeliveryOptions",
    query: `
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
    `,
    variables: { cartId },
  });

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
      title: opt.title ?? opt.deliveryMethodType,
      estimatedCost: opt.estimatedCost,
      deliveryMethodType: opt.deliveryMethodType,
    }));
}

export async function updateCartDeliveryAddress(
  addressId: string,
  address: {
    city?: string;
    countryCode: string;
    zip?: string;
    customerAddressId?: string;
  },
): Promise<Cart | undefined> {
  const cartId = (await cookies()).get("shopify_cartId")?.value;
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

  const data = await shopifyFetch<{
    cartDeliveryAddressesUpdate: CartMutationPayload<ShopifyCart>;
  }>({
    operation: "cartDeliveryAddressesUpdate",
    query: `
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
        }
      }
    `,
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

  const cart = transformShopifyCart(
    unwrapCartMutation(data.cartDeliveryAddressesUpdate, "cartDeliveryAddressesUpdate"),
  );
  invalidateCartCache();
  return cart;
}
