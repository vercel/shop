import {
  createStorefrontClient,
  type GraphQLFormattedError,
  type I18nConfig,
  type StorefrontClient,
  type StorefrontQueryString,
} from "@shopify/hydrogen";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN as string;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN as string;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-04";
const DEBUG = process.env.DEBUG_SHOPIFY === "true";

function operationName(body: RequestInit["body"]): string {
  if (typeof body !== "string") return "anonymous";
  try {
    const { query } = JSON.parse(body) as { query?: string };
    return query?.match(/\b(?:query|mutation)\s+(\w+)/)?.[1] ?? "anonymous";
  } catch {
    return "anonymous";
  }
}

// Preserve the prior shopifyFetch behavior the SDK doesn't replicate: the
// ?operation= URL annotation for network-tab/debug visibility, brotli, and the
// DEBUG_SHOPIFY timing log. Caching stays at the operation-function level.
const customFetchApi: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const operation = operationName(init?.body);
  const annotated = `${url}${url.includes("?") ? "&" : "?"}operation=${operation}`;
  const headers = new Headers(init?.headers);
  headers.set("Accept-Encoding", "gzip, br");

  const start = DEBUG ? performance.now() : 0;
  const response = await fetch(annotated, { ...init, headers });
  if (DEBUG) {
    console.log(`[shopify] ${operation} ${(performance.now() - start).toFixed(0)}ms`);
  }
  return response;
};

// The Hydrogen client injects its own i18n config into `$country`/`$language`,
// overriding per-request variables — so the client must be created with the
// call's locale pair. Creation is just config/closure allocation, so a fresh
// client per call is fine.
function getClient(country: string, language: string): StorefrontClient {
  return createStorefrontClient({
    type: "public",
    config: {
      apiVersion: SHOPIFY_API_VERSION,
      fetch: customFetchApi,
      i18n: { country, language } as I18nConfig,
      publicStorefrontToken: SHOPIFY_ACCESS_TOKEN,
      storeDomain: SHOPIFY_STORE_DOMAIN,
    },
  });
}

interface StorefrontRequestOptions {
  variables?: Record<string, unknown>;
}

interface StorefrontResponse<T> {
  data?: T | null;
  errors?: GraphQLFormattedError[];
}

// No `server-only` guard: the Storefront token is public, so the eve agent runtime can import this client directly.
export const storefront = {
  async request<T>(
    query: string,
    options?: StorefrontRequestOptions,
  ): Promise<StorefrontResponse<T>> {
    const variables = options?.variables;
    const country =
      typeof variables?.country === "string" ? variables.country : getCountryCode(defaultLocale);
    const language =
      typeof variables?.language === "string" ? variables.language : getLanguageCode(defaultLocale);

    // Operations pass codegen-typed queries as plain strings; brand them so the
    // client accepts our variables instead of inferring `never` from `string`.
    const doc = query as StorefrontQueryString<T, Record<string, unknown>>;
    const { data, errors } = await getClient(country, language).graphql(doc, { variables });
    return { data, errors };
  },
};
