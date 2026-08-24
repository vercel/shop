import "server-only";
import { createShopifyRequestContext } from "@shopify/hydrogen";
import {
  type CustomerAccountClient,
  type CustomerAccountDocument,
  createCustomerAccountClient,
  gql,
} from "@shopify/hydrogen/customer-account";

import { shopConfig } from "@/lib/config";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";

import { resolveShopId } from "./discovery";
import { logShopifyDebug, shopifyLogger } from "./logging";

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

  const start = performance.now();
  // Brand runtime strings so Hydrogen does not infer `never` variables.
  const doc = gql(query) as CustomerAccountDocument<T, Record<string, unknown>>;
  try {
    const { data, errors } = await client.graphql(doc, { accessToken, variables });

    if (errors) {
      if (!data) {
        throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
      }
      shopifyLogger.warn("Customer Account API returned partial errors", {
        errors,
        operation,
        scope: "customer-account",
      });
    }

    return data as T;
  } finally {
    logShopifyDebug("Customer Account API request", {
      durationMs: Math.round(performance.now() - start),
      operation,
      scope: "customer-account",
    });
  }
}
