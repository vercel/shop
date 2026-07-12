import "server-only";
import { createShopifyRequestContext } from "@shopify/hydrogen";
import {
  type CustomerAccountClient,
  type CustomerAccountDocument,
  createCustomerAccountClient,
  gql,
} from "@shopify/hydrogen/customer-account";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import { shopConfig } from "@/shop.config";

import { resolveShopId } from "./discovery";

const DEBUG = process.env.DEBUG_SHOPIFY === "true";

// Hydrogen requires an HTTPS Origin matching the OAuth-registered auth base URL.
export async function customerAccountFetch<T>({
  accessToken,
  operation,
  query,
  variables,
}: {
  accessToken: string;
  operation: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const shopId = await resolveShopId();
  const client: CustomerAccountClient = createCustomerAccountClient({
    shopId,
    requestContext: createShopifyRequestContext({
      i18n: {
        country: getCountryCode(defaultLocale) as never,
        language: getLanguageCode(defaultLocale) as never,
      },
      request: new Request(shopConfig.site.url),
    }),
  });

  const start = DEBUG ? performance.now() : 0;
  // Brand runtime strings so Hydrogen does not infer `never` variables.
  const doc = gql(query) as CustomerAccountDocument<T, Record<string, unknown>>;
  const { data, errors } = await client.graphql(doc, { accessToken, variables });

  if (DEBUG) {
    const duration = performance.now() - start;
    console.log(`[shopify:customer] ${operation} ${duration.toFixed(0)}ms`);
  }

  if (errors) {
    if (!data) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }
    console.warn(
      `[shopify:customer] ${operation} returned partial errors: ${JSON.stringify(errors)}`,
    );
  }

  return data as T;
}
