import {
  createShopifyRequestContext,
  createStorefrontClient,
  type GraphQLFormattedError,
  type I18nConfig,
  type StorefrontClient,
  type StorefrontQueryString,
} from "@shopify/hydrogen";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN as string;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN as string;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "unstable";
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

// Hydrogen lacks operation URL annotations and debug timing, so custom fetch preserves them.
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

// Hydrogen overrides locale variables from client config, requiring a client per locale pair.
function getClient(country: string, language: string): StorefrontClient {
  return createStorefrontClient({
    type: "public",
    requestContext: createShopifyRequestContext({
      i18n: { country, language } as I18nConfig,
      request: new Request(`https://${SHOPIFY_STORE_DOMAIN}`),
    }),
    config: {
      apiVersion: SHOPIFY_API_VERSION,
      fetch: customFetchApi,
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

    // Brand runtime strings so Hydrogen does not infer `never` variables.
    const doc = query as StorefrontQueryString<T, Record<string, unknown>>;
    const { data, errors } = await getClient(country, language).graphql(doc, { variables });
    return { data, errors };
  },
};

const MCP_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/api/mcp`;
const UCP_AGENT_PROFILE_URL = process.env.UCP_AGENT_PROFILE_URL;

let mcpRpcId = 0;

export async function callStorefrontMcp<T>(
  tool: string,
  args: Record<string, unknown>,
): Promise<T> {
  const meta = UCP_AGENT_PROFILE_URL
    ? { "ucp-agent": { profile: UCP_AGENT_PROFILE_URL } }
    : undefined;

  const response = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: ++mcpRpcId,
      jsonrpc: "2.0",
      method: "tools/call",
      params: { arguments: { ...(meta ? { meta } : {}), ...args }, name: tool },
    }),
  });

  if (!response.ok) {
    throw new Error(`Storefront MCP ${tool}: HTTP ${response.status}`);
  }

  const json = (await response.json()) as {
    error?: { message?: string };
    result?: {
      content?: Array<{ text?: string; type?: string }>;
      isError?: boolean;
      structuredContent?: unknown;
    };
  };

  if (json.error) {
    throw new Error(`Storefront MCP ${tool}: ${json.error.message ?? "request failed"}`);
  }

  const result = json.result;
  const text = result?.content?.find((c) => c.type === "text")?.text;

  if (result?.isError) {
    throw new Error(`Storefront MCP ${tool}: ${text ?? "tool returned an error"}`);
  }

  // Some servers return the payload as a JSON text block rather than structuredContent.
  if (result?.structuredContent !== undefined) return result.structuredContent as T;
  if (text) return JSON.parse(text) as T;

  throw new Error(`Storefront MCP ${tool}: empty response`);
}

export interface McpMoney {
  amount: number;
  currency: string;
}

export interface McpCatalogProduct {
  categories?: Array<{ name?: string }>;
  description?: { html?: string };
  id: string;
  media?: Array<{ alt_text?: string; url?: string }>;
  price_range?: { max?: McpMoney; min?: McpMoney };
  tags?: string[];
  title: string;
  variants?: Array<{
    availability?: { available?: boolean };
    id: string;
    media?: Array<{ url?: string }>;
    price?: McpMoney;
    title?: string;
  }>;
}

export interface McpCatalogSearchResult {
  instructions?: string;
  pagination?: { cursor?: string; has_next_page?: boolean };
  products?: McpCatalogProduct[];
}

export async function searchCatalog(params: {
  intent?: string;
  limit?: number;
  locale?: string;
  query: string;
}): Promise<McpCatalogSearchResult> {
  const { intent, limit = 10, locale = defaultLocale, query } = params;

  const context: Record<string, unknown> = {
    address_country: getCountryCode(locale),
    language: getLanguageCode(locale),
  };
  if (intent) context.intent = intent;

  return callStorefrontMcp<McpCatalogSearchResult>("search_catalog", {
    catalog: { context, pagination: { limit }, query },
  });
}

// MCP details use major-unit strings while search uses minor-unit numbers.
export interface McpProductDetails {
  description?: string;
  image_url?: string | null;
  images?: Array<{ alt_text?: string; url?: string }>;
  options?: Array<{ name?: string; values?: string[] }>;
  price_range?: { currency?: string; max?: string; min?: string };
  product_id: string;
  selectedOrFirstAvailableVariant?: {
    available?: boolean;
    currency?: string;
    price?: string;
    title?: string;
    variant_id?: string;
  };
  title: string;
  total_variants?: number;
}

export async function getCatalogProduct(params: {
  locale?: string;
  options?: Record<string, string>;
  productId: string;
}): Promise<McpProductDetails | undefined> {
  const { locale = defaultLocale, options, productId } = params;

  const result = await callStorefrontMcp<{ product?: McpProductDetails }>("get_product_details", {
    country: getCountryCode(locale),
    language: getLanguageCode(locale),
    product_id: productId,
    ...(options ? { options } : {}),
  });
  return result.product;
}

export interface McpPolicyAnswer {
  answer?: string;
  question?: string;
  sources?: Array<{ title?: string; url?: string }>;
}

export async function searchShopPoliciesAndFaqs(params: {
  context?: string;
  query: string;
}): Promise<McpPolicyAnswer[]> {
  const { context, query } = params;

  const result = await callStorefrontMcp<McpPolicyAnswer | McpPolicyAnswer[]>(
    "search_shop_policies_and_faqs",
    { query, ...(context ? { context } : {}) },
  );
  return Array.isArray(result) ? result : [result];
}
