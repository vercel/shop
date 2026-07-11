import "server-only";
import { createShopifyRequestContext } from "@shopify/hydrogen";
import {
  type CustomerAccountClient,
  type CustomerAccountDocument,
  createCustomerAccountClient,
  gql,
} from "@shopify/hydrogen/customer-account";

import { getAuthBaseUrl } from "@/lib/auth/server";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN as string;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-04";
const DEBUG = process.env.DEBUG_SHOPIFY === "true";

// Hydrogen needs the numeric shop ID embedded in Shopify's OIDC issuer.
let shopIdPromise: Promise<string> | undefined;

function resolveShopId(): Promise<string> {
  if (!shopIdPromise) {
    shopIdPromise = (async () => {
      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/.well-known/openid-configuration`,
        { next: { revalidate: 86400 } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load Shopify OIDC discovery: ${response.status}`);
      }
      const config: { issuer?: string } = await response.json();
      const shopId = config.issuer?.split("/").pop();
      if (!shopId) {
        throw new Error("Could not derive Shopify shop ID from OIDC issuer");
      }
      return shopId;
    })().catch((error) => {
      shopIdPromise = undefined;
      throw error;
    });
  }
  return shopIdPromise;
}

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
    customerApiVersion: SHOPIFY_API_VERSION,
    requestContext: createShopifyRequestContext({
      i18n: {
        country: getCountryCode(defaultLocale) as never,
        language: getLanguageCode(defaultLocale) as never,
      },
      request: new Request(getAuthBaseUrl()),
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
