import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type { McpCatalogSearchResult, McpPolicyAnswer } from "@/lib/shopify/mcp/types";

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string;
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
