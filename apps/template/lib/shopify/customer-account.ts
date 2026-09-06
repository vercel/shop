import "server-only";
import { createShopifyRequestContext } from "@shopify/hydrogen";
import {
  type AnyCustomerAccountDocument,
  type CustomerAccountClient,
  type CustomerAccountDocument,
  createCustomerAccountClient,
} from "@shopify/hydrogen/customer-account";
import { headers } from "next/headers";

import { shopConfig } from "@/lib/config";
import { getCountryCode, getLanguageCode, getRequestLocale } from "@/lib/i18n";

import { resolveShopId } from "./discovery";
import { logShopifyDebug, shopifyLogger } from "./logging";

export type CustomerAccountResultOf<Doc> =
  Doc extends CustomerAccountDocument<infer Result, never, string> ? Result : never;

// Hydrogen auto-injects `$language`; the app owns `country` in the request context.
type CustomerAccountVariables<Doc extends AnyCustomerAccountDocument> = Omit<
  Doc extends CustomerAccountDocument<unknown, infer Variables, string> ? Variables : never,
  "language"
>;

type CustomerAccountFetchOptions<Doc extends AnyCustomerAccountDocument> = {
  accessToken: string;
  document: Doc;
  locale?: string;
  operation: string;
} & (Record<string, never> extends CustomerAccountVariables<Doc>
  ? { variables?: CustomerAccountVariables<Doc> }
  : { variables: CustomerAccountVariables<Doc> });

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
