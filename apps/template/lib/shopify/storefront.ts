import "server-only";
import { createStorefrontApiClient } from "@shopify/storefront-api-client";

interface CustomRequestInit {
  body?: string;
  headers?: HeadersInit;
  keepalive?: boolean;
  method?: string;
  signal?: AbortSignal;
}

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN as string;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN as string;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-04";
const DEBUG = process.env.DEBUG_SHOPIFY === "true";

function operationName(body: string | undefined): string {
  if (!body) return "anonymous";
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
const customFetchApi = async (url: string, init?: CustomRequestInit): Promise<Response> => {
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

export const storefront = createStorefrontApiClient({
  apiVersion: SHOPIFY_API_VERSION,
  customFetchApi,
  publicAccessToken: SHOPIFY_ACCESS_TOKEN,
  storeDomain: SHOPIFY_STORE_DOMAIN,
});
