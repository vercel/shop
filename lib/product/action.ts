"use server";

import { toProductFormInput } from "@/lib/product";
import { getProduct } from "@/lib/product/server";
import type { QuickShopProduct, SelectedOption } from "@/lib/product/types";
import { fetchProductVariant } from "@/lib/shopify/operations/products/server";

// Purchase data loads on intent so catalog grids do not carry every product's variants.
export async function loadQuickShopProductAction(
  handle: string,
  selectedOptions?: SelectedOption[],
): Promise<QuickShopProduct | null> {
  const product = await getProduct({ handle });
  if (!product || product.isGiftCard) return null;

  let variant = product.defaultVariant;
  if (selectedOptions !== undefined) {
    if (
      !Array.isArray(selectedOptions) ||
      selectedOptions.length !== product.options.length ||
      selectedOptions.some(
        (option) => typeof option?.name !== "string" || typeof option?.value !== "string",
      )
    ) {
      return null;
    }
    const canonicalOptions: SelectedOption[] = [];
    for (const option of product.options) {
      const exactNames = selectedOptions.filter(({ name }) => name === option.name);
      const selected = exactNames.length
        ? exactNames
        : selectedOptions.filter(({ name }) => name.toLowerCase() === option.name.toLowerCase());
      if (selected.length !== 1) return null;
      const matchedValue =
        option.values.find((value) => value.name === selected[0].value) ??
        option.values.find((value) => value.name.toLowerCase() === selected[0].value.toLowerCase());
      if (!matchedValue) return null;
      canonicalOptions.push({ name: option.name, value: matchedValue.name });
    }
    const resolvedVariant = await fetchProductVariant({
      handle,
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
