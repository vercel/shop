import {
  createCartCookie,
  createCartServerHandlers,
  createShopifyRequestContext,
} from "@shopify/hydrogen";
import type { ToolContext } from "eve/tools";
import { z } from "zod";

import { shopConfig } from "../../lib/config";
import { CART_FRAGMENT } from "../../lib/shopify/fragments/cart";
import { createRequestStorefrontClient } from "../../lib/shopify/storefront/server";

const cartHandlers = createCartServerHandlers({ fragment: CART_FRAGMENT });

export function getSessionCartId(ctx: ToolContext) {
  const cartId = ctx.session.auth.current?.attributes.cartId;
  return typeof cartId === "string" ? cartId : undefined;
}

export async function getCart(cartId: string | undefined) {
  if (!cartId) return undefined;
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    headers: { cookie: createCartCookie(cartId).split(";")[0] },
  });
  const requestContext = createShopifyRequestContext({ i18n: shopConfig.localization, request });
  const storefrontClient = createRequestStorefrontClient(requestContext);
  const { data } = await cartHandlers.get({ request, storefrontClient });
  return data.cart ?? undefined;
}

export async function mutateCart(cartId: string | undefined, payload: object) {
  if (!cartId) return { error: "Open the storefront to change your cart." };
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
      cookie: createCartCookie(cartId).split(";")[0],
    },
    method: "POST",
  });
  const requestContext = createShopifyRequestContext({
    i18n: shopConfig.localization,
    request,
  });
  const storefrontClient = createRequestStorefrontClient(requestContext);
  const result = await cartHandlers.post({ request, storefrontClient });
  if (result.type !== "json") throw new Error("Cart mutation could not be confirmed.");
  const data = z
    .object({
      cart: z.object({ id: z.string() }).nullable(),
      userErrors: z.array(z.object({ message: z.string() })).optional(),
      warnings: z.array(z.object({ message: z.string() })).optional(),
    })
    .parse(result.data);
  if (data.userErrors?.length)
    return { error: data.userErrors.map((error) => error.message).join("; ") };
  if (!data.cart || data.cart.id !== cartId) throw new Error("Cart change could not be confirmed.");
  return {
    cartUpdated: true,
    warnings: data.warnings?.map((warning) => warning.message) ?? [],
  };
}
