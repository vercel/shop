import {
  type AnyStorefrontQueryString,
  createShopifyRequestContext,
  createStorefrontClient,
  type GraphQLFormattedError,
  type StorefrontApi,
  type StorefrontClient,
} from "@shopify/hydrogen";

import { type CommerceLocale, shopConfig } from "@/lib/config";

import { logShopifyDebug } from "./logging";

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

// Hydrogen's StorefrontApi.ResultOf collapses on fragment documents (Variables = never), so read the gql.tada decoration directly.
export type ResultOf<Doc> = Doc extends { __apiType?: (variables: never) => infer Result }
  ? Result
  : never;

// Hydrogen injects `$country`/`$language` from the client's i18n, so callers pass a locale instead.
type StorefrontVariables<Doc extends AnyStorefrontQueryString> = Omit<
  StorefrontApi.VariablesOf<Doc>,
  "country" | "language"
>;

type StorefrontRequestOptions<Doc extends AnyStorefrontQueryString> = {
  locale?: CommerceLocale;
} & (Record<string, never> extends StorefrontVariables<Doc>
  ? { variables?: StorefrontVariables<Doc> }
  : { variables: StorefrontVariables<Doc> });

export interface StorefrontResponse<T> {
  data?: T | null;
  errors?: GraphQLFormattedError[];
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

const MCP_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/api/mcp`;

const UCP_AGENT_PROFILE_URL = process.env.UCP_AGENT_PROFILE_URL;

let mcpRpcId = 0;

async function callStorefrontMcp<T>(tool: string, args: Record<string, unknown>): Promise<T> {
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

interface McpMoney {
  amount: number;
  currency: string;
}

interface McpCatalogProduct {
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
  locale?: CommerceLocale;
  query: string;
}): Promise<McpCatalogSearchResult> {
  const { intent, limit = 10, locale = shopConfig.localization, query } = params;
  const context: Record<string, unknown> = {
    address_country: locale.country,
    language: locale.language,
  };
  if (intent) context.intent = intent;
  return callStorefrontMcp<McpCatalogSearchResult>("search_catalog", {
    catalog: { context, pagination: { limit }, query },
  });
}

// MCP details use major-unit strings while search uses minor-unit numbers.

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
