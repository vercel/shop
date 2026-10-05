import {
  cartQueries,
  createCartServerHandlers,
  createShopifyRequestContext,
  getCartId,
  type ShopifyRequestContext,
} from "@shopify/hydrogen";
import type { WritableCustomerSessionManager } from "@shopify/hydrogen/customer-account";
import { headers } from "next/headers";
import { cache } from "react";

import { getHydrogenCustomerSession, getReadonlyCustomerSessionManager } from "@/lib/auth/server";
import type { Cart, CartSeedData } from "@/lib/cart/types";
import { shopConfig } from "@/lib/config";
import { CART_FRAGMENT } from "@/lib/shopify/fragments/cart";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront/server";

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

const getRequestContext = cache(() => {
  const i18n = {
    country: shopConfig.localization.country,
    language: shopConfig.localization.language,
  };
  // An empty request ID suppresses Hydrogen's synchronous UUID fallback.
  return createShopifyRequestContext({
    i18n,
    request: { headers: new Headers({ "x-request-id": "" }) },
  });
});

async function getHandlerContext() {
  const requestContext = getRequestContext();
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

async function getCartData(cartId: string | undefined): Promise<CartSeedData> {
  const { handlers, ...context } = await getHandlerContext();
  const url = new URL("/api/cart", shopConfig.site.url);
  if (cartId) url.searchParams.set("cartId", cartId);
  const { data } = await handlers.get({ ...context, request: new Request(url) } as never);
  return data;
}

// Carts are never put in the Next.js data cache — layout and page share only this per-request promise.
export const seedCartData = cache(async (): Promise<CartSeedData> => {
  return getCartData(await getCartIdFromCookie());
});

export async function getCart(): Promise<Cart | undefined> {
  const { cart } = await seedCartData();
  return cart ?? undefined;
}

export async function getCartById(cartId: string): Promise<Cart | undefined> {
  const data = await getCartData(cartId);
  if (data.errors?.length) throw new Error(data.errors[0].message);
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
          countryCode: shopConfig.localization.country,
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
