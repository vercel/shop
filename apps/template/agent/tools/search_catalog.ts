import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchProductHandlesByIds } from "@/lib/shopify/fetch";
import { type McpMoney, searchCatalog } from "@/lib/shopify/storefront-mcp";

import { getLocale } from "../lib/session";

// MCP returns minor currency units (e.g. 38900 = 389.00). Prototype assumes 2 decimals.
function formatMoney(money?: McpMoney): string | null {
  if (!money) return null;
  return `${(money.amount / 100).toFixed(2)} ${money.currency}`;
}

export default defineTool({
  description: `Search the catalog using Shopify's native Storefront MCP semantic search.
Experimental alternative to search_products: it calls Shopify's hosted agentic search, which
honors merchant-configured relevance and accepts a natural-language buyer "intent" hint.
Returns matching products with titles, prices, availability, images, a Shopify product GID
(productId), and the storefront handle — so results feed navigate_user, get_product_details,
and add_to_cart directly.`,
  inputSchema: z.object({
    query: z.string().describe("Search query (e.g. 'blue jacket', 'wireless speaker')"),
    intent: z
      .string()
      .optional()
      .describe("Optional buyer intent to bias relevance (e.g. 'prefers sustainable materials')"),
    limit: z.number().min(1).max(10).default(5).describe("Number of results to return (max 10)"),
  }),
  async execute({ intent, limit, query }, ctx) {
    try {
      const { pagination, products = [] } = await searchCatalog({
        intent,
        limit,
        locale: getLocale(ctx),
        query,
      });

      // Resolve GID -> storefront handle so results feed the handle-based tools.
      const handles = await fetchProductHandlesByIds(products.map((p) => p.id));

      return {
        success: true,
        total: products.length,
        hasMore: pagination?.has_next_page ?? false,
        products: products.map((p) => ({
          available: (p.variants ?? []).some((v) => v.availability?.available),
          handle: handles.get(p.id) ?? null,
          image: p.media?.[0]?.url ?? p.variants?.[0]?.media?.[0]?.url ?? null,
          price: formatMoney(p.price_range?.min),
          productId: p.id,
          title: p.title,
        })),
      };
    } catch (error) {
      console.error("Failed to search catalog via Storefront MCP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search catalog",
      };
    }
  },
});
