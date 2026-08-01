import "server-only";
import { createShopifyRequestContext, type I18nConfig } from "@shopify/hydrogen";
import { headers } from "next/headers";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

import { cartHandlers } from "./handlers";

/** Starts the full-cart read from the request cookie without awaiting it. */
export function seedCartData() {
  return (async () => {
    const i18n = {
      country: getCountryCode(defaultLocale),
      language: getLanguageCode(defaultLocale),
    } as I18nConfig;
    const requestContext = createShopifyRequestContext({
      i18n,
      request: { headers: await headers() },
    });
    const { data } = await cartHandlers.get({
      storefrontClient: createRequestStorefrontClient(requestContext),
    });
    return data;
  })();
}
