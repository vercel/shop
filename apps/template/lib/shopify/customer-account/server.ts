import "server-only";
import { createShopifyRequestContext } from "@shopify/hydrogen";
import {
  type AnyCustomerAccountDocument,
  type CustomerAccountClient,
  createCustomerAccountClient,
} from "@shopify/hydrogen/customer-account";

import { shopConfig } from "@/lib/config";
import type { CustomerAccountFetchOptions } from "@/lib/shopify/customer-account/types";
import { resolveShopId } from "@/lib/shopify/discovery/server";
import { logShopifyDebug, shopifyLogger } from "@/lib/shopify/logging/server";
import type { CustomerAccountResultOf } from "@/lib/shopify/types";

export async function customerAccountFetch<Doc extends AnyCustomerAccountDocument>({
  accessToken,
  document,
  operation,
  variables,
}: CustomerAccountFetchOptions<Doc>): Promise<CustomerAccountResultOf<Doc>> {
  const shopId = await resolveShopId();
  const client: CustomerAccountClient = createCustomerAccountClient({
    shopId,
    requestContext: createShopifyRequestContext({
      i18n: {
        country: shopConfig.localization.country,
        language: shopConfig.localization.language,
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
