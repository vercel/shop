import { createShopifyRequestContext } from "@shopify/hydrogen";
import "server-only";
import {
  type AnyCustomerAccountDocument,
  type CustomerAccountClient,
  createCustomerAccountClient,
} from "@shopify/hydrogen/customer-account";
import { headers } from "next/headers";

import { shopConfig } from "@/lib/config";
import { getCountryCode, getLanguageCode, getRequestLocale } from "@/lib/i18n";
import type { CustomerAccountFetchOptions } from "@/lib/shopify/customer-account/types";
import { resolveShopId } from "@/lib/shopify/discovery/server";
import { logShopifyDebug, shopifyLogger } from "@/lib/shopify/logging/server";
import type { CustomerAccountResultOf } from "@/lib/shopify/types";

export async function customerAccountFetch<Doc extends AnyCustomerAccountDocument>({
  accessToken,
  document,
  locale,
  operation,
  variables,
}: CustomerAccountFetchOptions<Doc>): Promise<CustomerAccountResultOf<Doc>> {
  const activeLocale = locale ?? getRequestLocale({ headers: await headers() });
  const shopId = await resolveShopId();
  const client: CustomerAccountClient = createCustomerAccountClient({
    shopId,
    requestContext: createShopifyRequestContext({
      i18n: {
        country: getCountryCode(activeLocale) as never,
        language: getLanguageCode(activeLocale) as never,
      },
      request: new Request(shopConfig.site.url),
    }),
  });
  const start = performance.now();
  try {
    const { data, errors } = await client.graphql(document, { accessToken, variables } as never);

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

    return data as CustomerAccountResultOf<Doc>;
  } finally {
    logShopifyDebug("Customer Account API request", {
      durationMs: Math.round(performance.now() - start),
      operation,
      scope: "customer-account",
    });
  }
}
