import "server-only";
import {
  createCartServerHandlers,
  createShopifyRequestContext,
  getCartId,
  gql,
  type I18nConfig,
} from "@shopify/hydrogen";
import { io } from "next/cache";
import { headers } from "next/headers";

import { getHydrogenCustomerSession, getReadonlyCustomerSessionManager } from "@/lib/auth/server";
import { shopConfig } from "@/lib/config";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
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

/** Starts the full-cart read from the request cookie without awaiting it. */
export function seedCartData() {
  return (async () => {
    // Hydrogen's createShopifyRequestContext calls crypto.randomUUID(); exclude it from the static shell.
    await io();
    const i18n = {
      country: getCountryCode(defaultLocale),
      language: getLanguageCode(defaultLocale),
    } as I18nConfig;
    const requestContext = createShopifyRequestContext({
      i18n,
      request: { headers: await headers() },
    });
    const storefrontClient = createRequestStorefrontClient(requestContext);
    if (!shopConfig.auth.isEnabled) {
      const { data } = await cartHandlers.get({ storefrontClient });
      return data;
    }

    const [customerSession, sessionManager] = await Promise.all([
      getHydrogenCustomerSession(),
      getReadonlyCustomerSessionManager(),
    ]);
    const customerCartHandlers = createCustomerCartHandlers(customerSession);
    const { data } = await customerCartHandlers.get({
      requestContext,
      sessionManager,
      storefrontClient,
    });
    return data;
  })();
}
