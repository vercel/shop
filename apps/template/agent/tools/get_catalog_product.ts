import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchProductHandlesByIds } from "@/lib/shopify/fetch";
import { getCatalogProduct } from "@/lib/shopify/storefront-mcp";

import { getLocale } from "../lib/session";

// get_product_details returns major-unit amount strings with a sibling currency.
function formatPrice(amount?: string, currency?: string): string | null {
  if (amount === undefined || currency === undefined) return null;
  const value = Number(amount);
  return Number.isFinite(value) ? `${value.toFixed(2)} ${currency}` : `${amount} ${currency}`;
}

export default defineTool({
  description: `Get a product's details from Shopify's native catalog (Storefront MCP) by its product ID (GID).
Use this after search_catalog when you have a productId (gid://shopify/Product/...). Returns pricing,
availability, options, images, and the storefront handle so you can then navigate_user or add_to_cart.
When you have a handle instead of a GID, use get_product_details.`,
  inputSchema: z.object({
    productId: z
      .string()
      .describe("Shopify product GID from search_catalog, e.g. gid://shopify/Product/123"),
  }),
  async execute({ productId }, ctx) {
    try {
      const product = await getCatalogProduct({ locale: getLocale(ctx), productId });
      if (!product) {
        return { success: false, error: `Product not found: ${productId}` };
      }

      const handle = (await fetchProductHandlesByIds([productId])).get(productId) ?? null;
      const variant = product.selectedOrFirstAvailableVariant;

      return {
        success: true,
        product: {
          available: variant?.available,
          description: product.description ?? null,
          handle,
          images: (product.images ?? []).flatMap((img) => (img.url ? [img.url] : [])),
          options: (product.options ?? []).map((o) => ({ name: o.name, values: o.values ?? [] })),
          price: formatPrice(product.price_range?.min, product.price_range?.currency),
          productId: product.product_id,
          title: product.title,
          totalVariants: product.total_variants,
          variantId: variant?.variant_id ?? null,
        },
      };
    } catch (error) {
      console.error("Failed to get catalog product via Storefront MCP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get product",
      };
    }
  },
});
