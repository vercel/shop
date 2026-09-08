import {
  cartQueries,
  createCartServerHandlers,
  createShopifyRequestContext,
  getCartId,
  gql,
  type ShopifyRequestContext,
  type I18nConfig,
} from "@shopify/hydrogen";
import "server-only";
import type { WritableCustomerSessionManager } from "@shopify/hydrogen/customer-account";
import { io } from "next/cache";
import { headers } from "next/headers";
import { cache } from "react";

import { getHydrogenCustomerSession, getReadonlyCustomerSessionManager } from "@/lib/auth/server";
import type { Cart, CartSeedData } from "@/lib/cart/types";
import { shopConfig } from "@/lib/config";
import { getCountryCode, getLanguageCode, getRequestLocale } from "@/lib/i18n";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront/server";

// The default Hydrogen fragment omits analytics timestamps, catalog prices, and line discounts.
const CART_FRAGMENT = gql(/* GraphQL */ `
  fragment CartFragment on Cart {
    updatedAt
    lines(first: 250) {
      nodes {
        sellingPlanAllocation {
          sellingPlan {
            name
          }
        }
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

const getRequestContext = cache(async (locale?: string) => {
  // Hydrogen's createShopifyRequestContext calls crypto.randomUUID(); exclude it from the static shell.
  await io();
  const requestHeaders = await headers();
  const activeLocale = locale ?? getRequestLocale({ headers: requestHeaders });
  const i18n = {
    country: getCountryCode(activeLocale),
    language: getLanguageCode(activeLocale),
  } as I18nConfig;
  return createShopifyRequestContext({ i18n, request: { headers: requestHeaders } });
});

async function getHandlerContext(locale?: string) {
  const requestContext = await getRequestContext(locale);
  const storefrontClient = createRequestStorefrontClient(requestContext);
  if (!shopConfig.auth.isEnabled)
    return { handlers: cartHandlers, requestContext, storefrontClient };

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
export const seedCartData = cache(async (locale?: string): Promise<CartSeedData> => {
  const { handlers, ...context } = await getHandlerContext(locale);
  const { data } = await handlers.get(context as never);
  return data;
});

export async function getCart(locale?: string): Promise<Cart | undefined> {
  const { cart } = await seedCartData(locale);
  return cart ?? undefined;
}

// Hydrogen's GET handler reads `?cartId=` before the cookie, which covers carts created mid-request.
export async function getCartById(cartId: string, locale?: string): Promise<Cart | undefined> {
  const { handlers, ...context } = await getHandlerContext(locale);
  const url = new URL("/api/cart", shopConfig.site.url);
  url.searchParams.set("cartId", cartId);
  const { data } = await handlers.get({ ...context, request: new Request(url) } as never);
  return data.cart ?? undefined;
}

// Streaming tools need a cart cookie before adding the first line; Hydrogen's POST rejects empty lines.
export async function createEmptyCart(
  requestContext: ShopifyRequestContext,
  sessionManager?: WritableCustomerSessionManager,
): Promise<string> {
  const storefrontClient = createRequestStorefrontClient(requestContext);
  const customerAccessToken = sessionManager
    ? await (
        await getHydrogenCustomerSession()
      ).getOrRefreshAccessToken(sessionManager, requestContext)
    : undefined;
  const { data, errors } = await storefrontClient.graphql(cartQueries.cartCreate, {
    variables: {
      input: {
        buyerIdentity: {
          countryCode: requestContext.i18n.country,
          ...(customerAccessToken ? { customerAccessToken } : {}),
        },
      },
    },
  });
  if (errors?.length) throw new Error(errors[0].message);
  const userErrors = data?.cartCreate?.userErrors ?? [];
  if (userErrors.length) throw new Error(userErrors.map((e) => e.message).join("; "));
  const cartId = data?.cartCreate?.cart?.id;
  if (!cartId) throw new Error("Cart creation returned no cart");
  return cartId;
}
