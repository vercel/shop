import { tool } from "ai";
import { z } from "zod";

import { fetchProductHandlesByIds } from "@/lib/shopify/fetch";
import { getCatalogProduct } from "@/lib/shopify/storefront";

import { getAgentContext } from "../server";

function formatPrice(amount?: string, currency?: string): string | null {
  if (amount === undefined || currency === undefined) return null;
  const value = Number(amount);
  return Number.isFinite(value) ? `${value.toFixed(2)} ${currency}` : `${amount} ${currency}`;
}

export function getCatalogProductTool() {
  return tool({
    description: `Get native Shopify catalog details by product GID after searchCatalog. Use getProductDetails when you have a handle.`,
    inputSchema: z.object({ productId: z.string() }),
    execute: async ({ productId }) => {
      try {
        const { user } = getAgentContext();
        const product = await getCatalogProduct({ locale: user.locale, productId });
        if (!product) return { error: `Product not found: ${productId}`, success: false };
        const handle = (await fetchProductHandlesByIds([productId])).get(productId) ?? null;
        const variant = product.selectedOrFirstAvailableVariant;
        return {
          product: {
            available: variant?.available,
            description: product.description ?? null,
            handle,
            images: (product.images ?? []).flatMap((image) => (image.url ? [image.url] : [])),
            options: (product.options ?? []).map((option) => ({
              name: option.name,
              values: option.values ?? [],
            })),
            price: formatPrice(product.price_range?.min, product.price_range?.currency),
            productId: product.product_id,
            title: product.title,
            totalVariants: product.total_variants,
            variantId: variant?.variant_id ?? null,
          },
          success: true,
        };
      } catch (error) {
        console.error("Failed to get catalog product via Storefront MCP:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to get product",
          success: false,
        };
      }
    },
  });
}
