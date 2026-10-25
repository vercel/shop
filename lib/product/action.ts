"use server";

import { z } from "zod";

import { toProductFormInput } from "@/lib/product";
import { getProduct } from "@/lib/product/server";
import type { QuickShopProduct, SelectedOption } from "@/lib/product/types";
import { fetchProductVariant } from "@/lib/shopify/operations/products/server";

const QUICK_SHOP_INPUT = z.strictObject({
  handle: z.string().min(1),
  selectedOptions: z.array(z.strictObject({ name: z.string(), value: z.string() })).optional(),
});

// Purchase data loads on intent so catalog grids do not carry every product's variants.
export async function loadQuickShopProductAction(
  handle: string,
  selectedOptions?: SelectedOption[],
): Promise<QuickShopProduct | null> {
  const parsed = QUICK_SHOP_INPUT.safeParse({ handle, selectedOptions });
  if (!parsed.success) return null;
  const input = parsed.data;

  const product = await getProduct({ handle: input.handle });
  if (!product || product.isGiftCard) return null;

  let variant = product.defaultVariant;
  if (input.selectedOptions !== undefined) {
    const requested = input.selectedOptions;
    if (requested.length !== product.options.length) return null;
    const canonicalOptions: SelectedOption[] = [];
    for (const option of product.options) {
      const exactNames = requested.filter(({ name }) => name === option.name);
      const selected = exactNames.length
        ? exactNames
        : requested.filter(({ name }) => name.toLowerCase() === option.name.toLowerCase());
      if (selected.length !== 1) return null;
      const matchedValue =
        option.values.find((value) => value.name === selected[0].value) ??
        option.values.find((value) => value.name.toLowerCase() === selected[0].value.toLowerCase());
      if (!matchedValue) return null;
      canonicalOptions.push({ name: option.name, value: matchedValue.name });
    }
    const resolvedVariant = await fetchProductVariant({
      handle: input.handle,
      selectedOptions: canonicalOptions,
    });
    if (
      !resolvedVariant ||
      canonicalOptions.some(
        ({ name, value }) =>
          !resolvedVariant.selectedOptions.some(
            (option) => option.name === name && option.value === value,
          ),
      )
    ) {
      return null;
    }
    variant = resolvedVariant;
  }

  return {
    availableForSale: product.availableForSale,
    form: toProductFormInput(product, variant),
    image: product.featuredImage?.url ?? null,
    hasOptions: product.options.some((option) => option.values.length > 1),
    title: product.title,
  };
}
