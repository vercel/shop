import { z } from "zod";

import { addCartNoteInputSchema, addToCartInputSchema, updateCartItemInputSchema } from "../cart";

const handle = z
  .string()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
  .max(255);
const options = z
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

export const commerceSchemas = {
  "add-cart-note": addCartNoteInputSchema,
  "add-to-cart": addToCartInputSchema,
  "browse-collection": z.strictObject({
    collection: handle,
    sortKey: z
      .enum(["best-matches", "price-low-to-high", "price-high-to-low", "BEST_SELLING", "CREATED"])
      .default("best-matches"),
  }),
  "get-cart": z.strictObject({}),
  "get-product-details": z.strictObject({ handle }),
  "get-recommendations": z.strictObject({ handle }),
  "list-collections": z.strictObject({}),
  "present-products": z.strictObject({
    ids: z.array(z.string().regex(/^gid:\/\/shopify\/Product\/[0-9]+$/)).max(12),
    options,
  }),
  "search-products": z.strictObject({
    options,
    query: z.string().min(1).max(500),
    sortKey: z
      .enum(["best-matches", "price-low-to-high", "price-high-to-low"])
      .default("best-matches"),
  }),
  "update-cart-item": updateCartItemInputSchema,
};

export function isCartMutation(tool: string) {
  return tool === "add-to-cart" || tool === "update-cart-item" || tool === "add-cart-note";
}
