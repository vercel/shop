import { z } from "zod";

import { toAgentProduct } from "../../lib/agent/products";
import type { ProductCard } from "../../lib/product/types";
import { fetchProductOptionValues } from "../../lib/shopify/catalog/server";

export const productHandleSchema = z
  .string()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
  .max(255);

export const productOptionsSchema = z
  .array(
    z.strictObject({
      name: z
        .string()
        .max(100)
        .describe("A product option the shopper explicitly requested, such as Color or Size."),
      value: z
        .string()
        .max(100)
        .describe(
          "The option value requested by the shopper, not a default variant value from search results.",
        ),
    }),
  )
  .max(10)
  .default([])
  .describe(
    "Only product-option constraints explicitly requested by the shopper. Use [] when none were requested. Never include country, language, locale, or currency: the storefront applies commerce context automatically.",
  );

export async function matchingProducts(
  products: ProductCard[],
  options: { name: string; value: string }[],
) {
  if (!options.length || !products.length) return products.slice(0, 12).map(toAgentProduct);
  const values = await fetchProductOptionValues(products.map((product) => product.id));
  return products
    .filter((product) =>
      options.every((option) =>
        values.get(product.handle)?.get(option.name.toLowerCase())?.has(option.value.toLowerCase()),
      ),
    )
    .slice(0, 12)
    .map(toAgentProduct);
}
