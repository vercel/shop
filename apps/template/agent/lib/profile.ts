export function agentProfileUrl() {
  if (process.env.UCP_AGENT_PROFILE_URL) return process.env.UCP_AGENT_PROFILE_URL;
  if (process.env.EVE_DEV === "1")
    return "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";
  return new URL("/agent/ucp-profile.json", process.env.AGENT_STOREFRONT_URL).href;
}

export const agentProfile = {
  ucp: {
    capabilities: {
      "dev.ucp.shopping.catalog.search": [
        {
          schema: "https://ucp.dev/2026-08-25/schemas/shopping/catalog_search.json",
          spec: "https://ucp.dev/2026-08-25/specification/catalog/search",
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
      "dev.shopify.catalog": [
        {
          extends: ["dev.ucp.shopping.catalog.lookup", "dev.ucp.shopping.catalog.search"],
          schema: "https://shopify.dev/ucp/schemas/2026-04-08/shopify_catalog.json",
          spec: "https://shopify.dev/docs/agents/catalog/storefront-catalog",
          version: "2026-08-25",
        },
      ],
    },
    payment_handlers: {},
    services: {
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
