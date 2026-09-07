import {
  type AnyStorefrontQueryString,
  type StorefrontClient,
  createShopifyRequestContext,
  createStorefrontClient,
} from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { logShopifyDebug } from "@/lib/shopify/logging/server";
import type { StorefrontRequestOptions, StorefrontVariables } from "@/lib/shopify/storefront/types";
import type { ResultOf, StorefrontResponse } from "@/lib/shopify/types";

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string;

const SHOPIFY_ACCESS_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN as string;

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "unstable";

const SHOPIFY_STOREFRONT_ID = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID;

function operationName(body: RequestInit["body"]): string {
  if (typeof body !== "string") return "anonymous";
  try {
    const { query } = JSON.parse(body) as { query?: string };
    return query?.match(/\b(?:query|mutation)\s+(\w+)/)?.[1] ?? "anonymous";
  } catch {
    return "anonymous";
  }
}

// Hydrogen lacks operation URL annotations and debug timing, so custom fetch preserves them.
const customFetchApi: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const operation = operationName(init?.body);
  const annotated = `${url}${url.includes("?") ? "&" : "?"}operation=${operation}`;
  const headers = new Headers(init?.headers);
  headers.set("Accept-Encoding", "gzip, br");

  const start = performance.now();
  try {
    return await fetch(annotated, { ...init, headers });
  } finally {
    logShopifyDebug("Storefront API request", {
      durationMs: Math.round(performance.now() - start),
      operation,
      scope: "storefront",
    });
  }
};

// Hydrogen overrides locale variables from client config, requiring a client per locale pair.
export function createRequestStorefrontClient(
  requestContext: ReturnType<typeof createShopifyRequestContext>,
): StorefrontClient {
  return createStorefrontClient({
    config: {
      apiVersion: SHOPIFY_API_VERSION,
      fetch: customFetchApi,
      publicStorefrontToken: SHOPIFY_ACCESS_TOKEN,
      storeDomain: SHOPIFY_STORE_DOMAIN,
      storefrontId: SHOPIFY_STOREFRONT_ID,
    },
    requestContext,
    type: "public",
  });
}

function getClient(
  country: CommerceLocale["country"],
  language: CommerceLocale["language"],
): StorefrontClient {
  return createRequestStorefrontClient(
    createShopifyRequestContext({
      i18n: { country, language },
      request: new Request(`https://${SHOPIFY_STORE_DOMAIN}`),
    }),
  );
}

export const storefront = {
  async request<Doc extends AnyStorefrontQueryString>(
    doc: Doc,
    ...[options]: Record<string, never> extends StorefrontVariables<Doc>
      ? [options?: StorefrontRequestOptions<Doc>]
      : [options: StorefrontRequestOptions<Doc>]
  ): Promise<StorefrontResponse<ResultOf<Doc>>> {
    const locale = options?.locale ?? shopConfig.localization;
    const client = getClient(locale.country, locale.language);
    const { data, errors } = await client.graphql(doc, {
      variables: options?.variables,
    } as never);
    return { data: data as ResultOf<Doc> | null, errors };
  },
};
