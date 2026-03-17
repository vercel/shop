import { tool } from "ai";
import { z } from "zod";

import { getProduct } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../context";

export function getProductDetailsTool() {
  return tool({
    description: `Get detailed information about a specific product by its handle.
Use this when the user asks about a product's details, variants, pricing, or availability.
The handle is the URL-friendly product identifier (e.g. "technest-smart-speaker-pro-jk0c").
You can get handles from search results or the current page context.`,
    inputSchema: z.object({
      handle: z
        .string()
        .describe("The product handle (URL slug) from search results or page context"),
    }),
    execute: async ({ handle }) => {
      const { user } = getAgentContext();

      try {
        const product = await getProduct(handle, user.locale);

        return {
          success: true,
          product: {
            title: product.title,
            handle: product.handle,
            description: product.description,
            price: `${product.price.amount} ${product.price.currencyCode}`,
            compareAtPrice: product.compareAtPrice
              ? `${product.compareAtPrice.amount} ${product.compareAtPrice.currencyCode}`
              : null,
            available: product.availableForSale,
            vendor: product.vendor,
            tags: product.tags,
            images: product.images.map((img) => img.url),
            variants: product.variants.map((v) => ({
              id: v.id,
              title: v.title,
              available: v.availableForSale,
              price: `${v.price.amount} ${v.price.currencyCode}`,
              options: v.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(", "),
            })),
            options: product.options.map((o) => ({
              name: o.name,
              values: o.values.map((v) => v.name),
            })),
          },
        };
      } catch (error) {
        console.error("Failed to get product details:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get product details",
        };
      }
    },
  });
}
