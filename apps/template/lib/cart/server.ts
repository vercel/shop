import "server-only";
import {
  cartQueries,
  createCartServerHandlers,
  createShopifyRequestContext,
  getCartId,
  gql,
} from "@shopify/hydrogen";
import { io } from "next/cache";
import { headers } from "next/headers";
import { cache } from "react";

import { getHydrogenCustomerSession, getReadonlyCustomerSessionManager } from "@/lib/auth/server";
import type { Cart, CartSeedData, CartWarning } from "@/lib/cart";
import { shopConfig } from "@/lib/config";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

// The default Hydrogen fragment omits analytics timestamps, catalog prices, and line discounts.
const CART_FRAGMENT = gql(/* GraphQL */ `
  fragment CartFragment on Cart {
    updatedAt
    lines(first: 250) {
      nodes {
        discountAllocations {
          __typename
          discountedAmount {
            amount
            currencyCode
          }
          ... on CartCodeDiscountAllocation {
            code
          }
          ... on CartAutomaticDiscountAllocation {
            title
          }
          ... on CartCustomDiscountAllocation {
            title
          }
        }
        merchandise {
          ... on ProductVariant {
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`);

export const cartHandlers = createCartServerHandlers({ fragment: CART_FRAGMENT });

export function createCustomerCartHandlers(
  customerSession: Awaited<ReturnType<typeof getHydrogenCustomerSession>>,
) {
  return createCartServerHandlers({
    customerSession,
    fragment: CART_FRAGMENT,
  });
}

export async function getCartIdFromCookie(): Promise<string | undefined> {
  const cookie = (await headers()).get("cookie") ?? undefined;
  return getCartId({ cookie }) ?? undefined;
}

const getRequestContext = cache(async () => {
  // Hydrogen's createShopifyRequestContext calls crypto.randomUUID(); exclude it from the static shell.
  await io();
  const i18n = {
    country: shopConfig.localization.country,
    language: shopConfig.localization.language,
  };
  return createShopifyRequestContext({ i18n, request: { headers: await headers() } });
});

async function getHandlerContext() {
  const requestContext = await getRequestContext();
  const storefrontClient = createRequestStorefrontClient(requestContext);
  if (!shopConfig.auth.isEnabled) return { handlers: cartHandlers, storefrontClient };

  const [customerSession, sessionManager] = await Promise.all([
    getHydrogenCustomerSession(),
    getReadonlyCustomerSessionManager(),
  ]);
  return {
    handlers: createCustomerCartHandlers(customerSession),
    requestContext,
    sessionManager,
    storefrontClient,
  };
}

// Carts are never put in the Next.js data cache — layout and page share only this per-request promise.
export const seedCartData = cache(async (): Promise<CartSeedData> => {
  const { handlers, ...context } = await getHandlerContext();
  const { data } = await handlers.get(context as never);
  return data;
});

export async function getCart(): Promise<Cart | undefined> {
  const { cart } = await seedCartData();
  return cart ?? undefined;
}

// Hydrogen's GET handler reads `?cartId=` before the cookie, which covers carts created mid-request.
export async function getCartById(cartId: string): Promise<Cart | undefined> {
  const { handlers, ...context } = await getHandlerContext();
  const url = new URL("/api/cart", shopConfig.site.url);
  url.searchParams.set("cartId", cartId);
  const { data } = await handlers.get({ ...context, request: new Request(url) } as never);
  return data.cart ?? undefined;
}

/** Creates an empty cart so a streaming response can set the cookie before any line is added. */
export async function createEmptyCart(): Promise<string | undefined> {
  const { storefrontClient } = await getHandlerContext();
  const { data, errors } = await storefrontClient.graphql(cartQueries.cartCreate, {
    variables: {
      input: {
        buyerIdentity: {
          countryCode: shopConfig.localization.country,
        },
      },
    },
  });
  if (errors?.length) throw new Error(errors[0].message);
  const userErrors = data?.cartCreate?.userErrors ?? [];
  if (userErrors.length) throw new Error(userErrors.map((e) => e.message).join("; "));
  return data?.cartCreate?.cart?.id;
}

export type CartMutationInput =
  | {
      lines: {
        attributes?: { key: string; value: string }[];
        merchandiseId: string;
        quantity: number;
      }[];
    }
  | { lines: { id: string; quantity: number }[] }
  | { note: string };

export type CartMutationResult = { cart: Cart; warnings: CartWarning[] };

/**
 * Runs a cart mutation through Hydrogen's `/api/cart` handler without an HTTP round trip.
 * Callers that create a cart must persist `cart.id` with `createCartCookie` on their own response.
 */
export async function runCartMutation(
  input: CartMutationInput,
  cartId?: string,
): Promise<CartMutationResult> {
  const { handlers, requestContext: sharedContext, ...context } = await getHandlerContext();
  const requestContext = sharedContext ?? (await getRequestContext());
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    body: JSON.stringify({ ...input, ...(cartId ? { cartId } : {}) }),
    headers: {
      "content-type": "application/json",
      cookie: (await headers()).get("cookie") ?? "",
    },
    method: "POST",
  });
  // Cookies can't be committed from a tool call, so pass a read-only session and let refreshes fall through.
  const result = await handlers.post({
    ...context,
    request,
    requestContext,
    sessionManager: {
      ...("sessionManager" in context ? context.sessionManager : {}),
      commit: undefined,
    },
  } as never);

  if (result.type === "error") throw new Error(result.error.message);
  if (result.type !== "json") throw new Error("Cart mutation returned an unexpected response");

  // Hydrogen's POST result erases the cart fragment type even though it uses the same query as GET.
  const data = result.data as {
    cart?: Cart | null;
    userErrors?: { message: string }[];
    warnings?: CartWarning[];
  };
  if (data.userErrors?.length) throw new Error(data.userErrors.map((e) => e.message).join("; "));
  if (!data.cart) throw new Error("Cart mutation returned no cart");
  return { cart: data.cart, warnings: data.warnings ?? [] };
}
