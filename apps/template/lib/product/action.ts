"use server";

import { toProductFormInput } from "@/lib/product";
import { getProduct } from "@/lib/product/server";
import type { QuickShopProduct } from "@/lib/product/types";

// Fetched per shopper intent rather than with the grid: shipping every card's variants would
// multiply the browse payload by its variant count. Reuses the cached PDP read.
export async function loadQuickShopProductAction(handle: string): Promise<QuickShopProduct | null> {
  const product = await getProduct({ handle });
  if (!product || product.isGiftCard) return null;
  return {
    availableForSale: product.availableForSale,
    form: toProductFormInput(product, product.defaultVariant),
    image: product.featuredImage?.url ?? null,
    hasOptions: product.options.some((option) => option.values.length > 1),
    title: product.title,
  };
}
