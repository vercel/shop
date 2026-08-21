import "server-only";
import {
  createCartServerHandlers,
  createShopifyRequestContext,
  gql,
  type I18nConfig,
} from "@shopify/hydrogen";
import { io } from "next/cache";
import { cookies, headers } from "next/headers";

import { getHydrogenCustomerSession, getReadonlyCustomerSessionManager } from "@/lib/auth/server";
import { shopConfig } from "@/lib/config";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

// The default Hydrogen fragment omits analytics timestamps and merchandise.price.
// Include both so cart events deduplicate and prices preserve their catalog reference.
const CART_FRAGMENT = gql(/* GraphQL */ `
  fragment CartFragment on Cart {
    updatedAt
    lines(first: 250) {
      nodes {
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

// Shared with the Hydrogen cart handlers, RSC cart reads, and the AI agent.
const CART_ID_COOKIE = "cart";
const CART_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
const CART_GID_PREFIX = "gid://shopify/Cart/";
const CART_ID_COOKIE_SAME_SITE = process.env.VERCEL_ENV === "production" ? "strict" : "lax";

export async function getCartIdFromCookie(): Promise<string | undefined> {
  const raw = (await cookies()).get(CART_ID_COOKIE)?.value;
  if (!raw) return undefined;
  const token = decodeURIComponent(raw);
  return token.startsWith(CART_GID_PREFIX) ? token : `${CART_GID_PREFIX}${token}`;
}

export async function setCartIdCookie(id: string): Promise<void> {
  const token = id.startsWith(CART_GID_PREFIX) ? id.slice(CART_GID_PREFIX.length) : id;
  (await cookies()).set(CART_ID_COOKIE, encodeURIComponent(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: CART_ID_COOKIE_SAME_SITE,
    maxAge: CART_ID_COOKIE_MAX_AGE,
    path: "/",
  });
}

/** Streaming contexts can't call cookies().set(); they must emit Set-Cookie via response headers. */
export function buildCartIdSetCookieHeader(id: string): string {
  const token = id.startsWith(CART_GID_PREFIX) ? id.slice(CART_GID_PREFIX.length) : id;
  const secure = process.env.NODE_ENV === "production";
  const sameSite = CART_ID_COOKIE_SAME_SITE === "strict" ? "Strict" : "Lax";
  return `${CART_ID_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${CART_ID_COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`;
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
