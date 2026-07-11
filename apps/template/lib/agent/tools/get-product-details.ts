import { tool } from "ai";
import { z } from "zod";

import { getProductWithVariants } from "@/lib/shopify/operations/products";

import { getAgentContext } from "../server";

export function getProductDetailsTool() {
  return tool({
    description: `Get detailed product information by storefront handle, including variants, pricing, and availability.`,
    inputSchema: z.object({ handle: z.string() }),
    execute: async ({ handle }) => {
      try {
        const { user } = getAgentContext();
        const product = await getProductWithVariants({ handle, locale: user.locale });
        if (!product) return { error: `Product not found: ${handle}`, success: false };

        return {
          product: {
            available: product.availableForSale,
            compareAtPrice: product.compareAtPrice
              ? `${product.compareAtPrice.amount} ${product.compareAtPrice.currencyCode}`
              : null,
            description: product.description,
            handle: product.handle,
            images: product.images.map((image) => image.url),
            options: product.options.map((option) => ({
              name: option.name,
              values: option.values.map((value) => value.name),
            })),
            price: `${product.price.amount} ${product.price.currencyCode}`,
            tags: product.tags,
            title: product.title,
            variants: (product.variants ?? []).map((variant) => ({
              available: variant.availableForSale,
              id: variant.id,
              options: variant.selectedOptions
                .map((option) => `${option.name}: ${option.value}`)
                .join(", "),
              price: `${variant.price.amount} ${variant.price.currencyCode}`,
              title: variant.title,
            })),
            vendor: product.vendor,
          },
          success: true,
        };
      } catch (error) {
        console.error("Failed to get product details:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to get product details",
          success: false,
        };
      }
    },
  });
}
