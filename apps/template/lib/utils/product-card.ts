import type { ProductCard, ProductDetails } from "@/lib/types";

export const RESULTS_PER_PAGE = 50;

export function toProductCard(product: ProductDetails): ProductCard {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: product.featuredImage,
    price: product.priceRange.minVariantPrice,
    compareAtPrice: product.compareAtPrice,
    vendor: product.vendor,
    availableForSale: product.availableForSale,
    defaultVariantId: product.variants.find((v) => v.availableForSale)?.id,
    defaultVariantSelectedOptions:
      product.variants.find((v) => v.availableForSale)?.selectedOptions ?? [],
  };
}
