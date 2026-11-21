import { shopConfig } from "../../lib/config";

// Shopify offers a tool only to a profile that declares its capability, and no 2026-08-25 example declares both.
const EXAMPLE_PROFILES = {
  ask: "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/ask.json",
  catalog:
    "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json",
};

export function agentProfileUrl(capability: keyof typeof EXAMPLE_PROFILES) {
  if (process.env.UCP_AGENT_PROFILE_URL) return process.env.UCP_AGENT_PROFILE_URL;
  const origin = new URL(shopConfig.site.url);
  if (
    process.env.EVE_DEV === "1" ||
    process.env.VERCEL_ENV === "preview" ||
    ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
  )
    return EXAMPLE_PROFILES[capability];
  return new URL("/agent/ucp-profile.json", origin).href;
}

export const agentProfile = {
  ucp: {
    capabilities: {
      "dev.shopify.catalog": [
        {
          extends: ["dev.ucp.shopping.catalog.lookup", "dev.ucp.shopping.catalog.search"],
          schema: "https://shopify.dev/ucp/schemas/2026-08-25/shopify_catalog.json",
          spec: "https://shopify.dev/docs/agents/catalog/storefront-catalog",
          version: "2026-08-25",
        },
      ],
      "dev.ucp.common.ask": [
        {
          schema: "https://ucp.dev/2026-08-25/schemas/common/ask.json",
          spec: "https://ucp.dev/2026-08-25/specification/common/ask",
          version: "2026-08-25",
        },
      ],
      "dev.ucp.shopping.catalog.lookup": [
        {
          schema: "https://ucp.dev/2026-08-25/schemas/shopping/catalog_lookup.json",
          spec: "https://ucp.dev/2026-08-25/specification/catalog/lookup",
          version: "2026-08-25",
        },
      ],
      "dev.ucp.shopping.catalog.search": [
        {
          schema: "https://ucp.dev/2026-08-25/schemas/shopping/catalog_search.json",
          spec: "https://ucp.dev/2026-08-25/specification/catalog/search",
          version: "2026-08-25",
        },
      ],
    },
    payment_handlers: {},
    services: {
      "dev.ucp.common": [
        {
          schema: "https://ucp.dev/2026-08-25/services/common/mcp.openrpc.json",
          spec: "https://ucp.dev/2026-08-25/specification/overview",
          transport: "mcp",
          version: "2026-08-25",
        },
      ],
      "dev.ucp.shopping": [
        {
          schema: "https://ucp.dev/2026-08-25/services/shopping/mcp.openrpc.json",
          spec: "https://ucp.dev/2026-08-25/specification/overview",
          transport: "mcp",
          version: "2026-08-25",
        },
      ],
    },
    version: "2026-08-25",
  },
};
