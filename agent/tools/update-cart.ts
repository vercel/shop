import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchProductVariantBySelectedOptions } from "../../lib/shopify/operations/products/server";
import { getCart, getSessionCartId, mutateCart } from "../lib/cart";
import { productOptionsSchema } from "../lib/catalog";

const lineIdSchema = z.string().regex(/^gid:\/\/shopify\/CartLine\/[^\s]+$/);

const discountCodeSchema = z.string().trim().min(1).max(255);

const changeSchema = z.discriminatedUnion("action", [
  z
    .strictObject({
      action: z.literal("add"),
      quantity: z.number().int().min(1).max(99).default(1),
      variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/[0-9]+$/),
    })
    .describe(
      "Add a ProductVariant ID that get-product-details shows as available and matching the requested options.",
    ),
  z
    .strictObject({
      action: z.literal("set-quantity"),
      lineId: lineIdSchema,
      quantity: z.number().int().min(0).max(99),
    })
    .describe("Set a cart line's quantity; 0 removes the line."),
  z
    .strictObject({
      action: z.literal("change-options"),
      lineId: lineIdSchema,
      options: productOptionsSchema,
    })
    .describe("Change a cart line's options, such as its size or color, keeping its quantity."),
  z
    .strictObject({ action: z.literal("apply-discount"), code: discountCodeSchema })
    .describe(
      "Apply a discount code the shopper typed. Never guess, suggest, or try codes the shopper did not give.",
    ),
  z
    .strictObject({ action: z.literal("remove-discount"), code: discountCodeSchema })
    .describe("Remove a discount code from the cart."),
  z
    .strictObject({ action: z.literal("set-note"), note: z.string().max(1000) })
    .describe("Replace the cart note; keep any existing text the shopper wants to keep."),
]);

type CartChange = z.infer<typeof changeSchema>;

async function changeLineOptions(
  cartId: string,
  { lineId, options }: Extract<CartChange, { action: "change-options" }>,
) {
  const line = (await getCart(cartId))?.lines.nodes.find((node) => node.id === lineId);
  if (!line) return { error: "This line is not in the current cart." };
  if ("parentRelationship" in line && line.parentRelationship)
    return { error: "Change this item through the item it belongs to." };

  const selection = new Map(
    line.merchandise.selectedOptions.map((option) => [option.name.toLowerCase(), option]),
  );
  for (const option of options) selection.set(option.name.toLowerCase(), option);
  const result = await fetchProductVariantBySelectedOptions({
    handle: line.merchandise.product.handle,
    selectedOptions: [...selection.values()].map(({ name, value }) => ({ name, value })),
  });
  if (!result) return { error: "This product is no longer available." };
  const optionNames = new Set(result.options.map((option) => option.name.toLowerCase()));
  if (!options.length || options.some((option) => !optionNames.has(option.name.toLowerCase())))
    return { error: "Name options this product has.", options: result.options };

  const { variant } = result;
  if (!variant) return { error: "No variant has those options.", options: result.options };
  if (variant.id === line.merchandise.id) return { error: "This line already has those options." };
  if (!variant.availableForSale) return { error: "That option is sold out." };

  const sellingPlanId = line.sellingPlanAllocation?.sellingPlan.id;
  if (variant.requiresComponents || (variant.requiresSellingPlan && !sellingPlanId))
    return { error: "Choose that option on the product page." };

  return mutateCart(cartId, {
    lines: [
      {
        id: lineId,
        merchandiseId: variant.id,
        quantity: line.quantity,
        ...(sellingPlanId ? { sellingPlanId } : {}),
      },
    ],
  });
}

async function changeDiscountCodes(cartId: string, apply: boolean, code: string) {
  const cart = await getCart(cartId);
  if (!cart) return { error: "Cart is unavailable. Refresh the storefront." };
  const normalized = code.toUpperCase();
  const codes = cart.discountCodes.map((discount) => discount.code);
  const present = codes.some((existing) => existing.toUpperCase() === normalized);
  if (apply && present) return { error: "That code is already on the cart." };
  if (!apply && !present) return { error: "That code is not on the cart." };
  return mutateCart(cartId, {
    discountCodes: apply
      ? [...codes, normalized]
      : codes.filter((existing) => existing.toUpperCase() !== normalized),
  });
}

export default defineTool({
  description:
    "Change the shopper's cart, one change per call, only when they ask. Read get-cart before changing an existing line, discount code, or the note. Never retry an uncertain change.",
  inputSchema: z.strictObject({ change: changeSchema }),
  execute: async ({ change }, ctx) => {
    const cartId = getSessionCartId(ctx);
    if (!cartId) return { error: "Open the storefront to change your cart." };
    switch (change.action) {
      case "add":
        return mutateCart(cartId, {
          lines: [{ merchandiseId: change.variantId, quantity: change.quantity }],
        });
      case "set-quantity": {
        const cart = await getCart(cartId);
        if (!cart?.lines.nodes.some((line) => line.id === change.lineId))
          return { error: "This line is not in the current cart." };
        return mutateCart(cartId, { lines: [{ id: change.lineId, quantity: change.quantity }] });
      }
      case "change-options":
        return changeLineOptions(cartId, change);
      case "apply-discount":
        return changeDiscountCodes(cartId, true, change.code);
      case "remove-discount":
        return changeDiscountCodes(cartId, false, change.code);
      case "set-note":
        return mutateCart(cartId, { note: change.note });
    }
  },
});
