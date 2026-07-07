import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";

// Client for Shopify's Storefront MCP server — the store's hosted agentic-commerce
// tools (catalog search, policies, cart) exposed over JSON-RPC 2.0 at /api/mcp.
// Universal (no `server-only`/`next/cache`) so the eve agent runtime can import it.

const MCP_ENDPOINT = `https://${process.env.SHOPIFY_STORE_DOMAIN as string}/api/mcp`;
// Some stores require a UCP agent profile URL for capability negotiation; sent only when set.
const UCP_AGENT_PROFILE_URL = process.env.UCP_AGENT_PROFILE_URL;

export interface McpMoney {
  amount: number; // minor currency units (e.g. 38900 = 389.00)
  currency: string;
}

export interface McpCatalogProduct {
  categories?: Array<{ name?: string }>;
  description?: { html?: string };
  id: string; // Shopify Product GID — the MCP catalog response carries no storefront handle
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

let rpcId = 0;

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
      id: ++rpcId,
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

  // Prefer the structured envelope; some servers return it as a JSON text block instead.
  if (result?.structuredContent !== undefined) return result.structuredContent as T;
  if (text) return JSON.parse(text) as T;

  throw new Error(`Storefront MCP ${tool}: empty response`);
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
