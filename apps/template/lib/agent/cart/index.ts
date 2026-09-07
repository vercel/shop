import { z } from "zod";

export const addCartNoteInputSchema = z.strictObject({ note: z.string() });

export const addToCartInputSchema = z.strictObject({
  quantity: z.number().int().min(1).max(99).default(1),
  variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/[0-9]+$/),
});

export const updateCartItemInputSchema = z.strictObject({
  lineId: z.string().regex(/^gid:\/\/shopify\/CartLine\/[^\s]+$/),
  quantity: z.number().int().min(0).max(99),
});
