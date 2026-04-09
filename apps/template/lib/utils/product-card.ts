import { getNumericShopifyId } from "@/components/product/pdp/variants";
import type { ProductCard, ProductDetails } from "@/lib/types";

export const RESULTS_PER_PAGE = 50;

export function toProductCard(product: ProductDetails): ProductCard {
  const defaultVariant = product.variants.find((v) => v.availableForSale);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: product.featuredImage,
    price: product.priceRange.minVariantPrice,
    compareAtPrice: product.compareAtPrice,
    vendor: product.vendor,
    availableForSale: product.availableForSale,
    defaultVariantId: defaultVariant?.id,
    defaultVariantNumericId: defaultVariant ? (getNumericShopifyId(defaultVariant.id) ?? undefined) : undefined,
    defaultVariantSelectedOptions: defaultVariant?.selectedOptions ?? [],
  };
}
