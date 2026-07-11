import { tool } from "ai";
import { z } from "zod";

import { fetchProductHandlesByIds } from "@/lib/shopify/fetch";
import { type McpMoney, searchCatalog } from "@/lib/shopify/storefront";

import { getAgentContext } from "../server";

function formatMoney(money?: McpMoney): string | null {
  return money ? `${(money.amount / 100).toFixed(2)} ${money.currency}` : null;
}

export function searchCatalogTool() {
  return tool({
    description: `Search Shopify's native catalog semantically. Prefer this for vague, descriptive, or preference-driven requests.`,
    inputSchema: z.object({
      intent: z.string().optional(),
      limit: z.number().min(1).max(10).default(5),
      query: z.string(),
    }),
    execute: async ({ intent, limit, query }) => {
      try {
        const { user } = getAgentContext();
        const { pagination, products = [] } = await searchCatalog({
          intent,
          limit,
          locale: user.locale,
          query,
        });
        const handles = await fetchProductHandlesByIds(products.map((product) => product.id));
        return {
          hasMore: pagination?.has_next_page ?? false,
          products: products.map((product) => ({
            available: (product.variants ?? []).some((variant) => variant.availability?.available),
            handle: handles.get(product.id) ?? null,
            image: product.media?.[0]?.url ?? product.variants?.[0]?.media?.[0]?.url ?? null,
            price: formatMoney(product.price_range?.min),
            productId: product.id,
            title: product.title,
          })),
          success: true,
          total: products.length,
        };
      } catch (error) {
        console.error("Failed to search catalog via Storefront MCP:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to search catalog",
          success: false,
        };
      }
    },
  });
}
