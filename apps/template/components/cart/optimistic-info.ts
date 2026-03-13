import type { Image, Money, SelectedOption } from "@/lib/types";

// Product info needed to construct an optimistic CartLine
export type OptimisticProductInfo = {
  variantTitle: string;
  productTitle: string;
  productHandle: string;
  price: Money;
  image: Image;
  selectedOptions: SelectedOption[];
};

// Build OptimisticProductInfo from a ProductCard (grid/carousel quick-add)
export function productCardToOptimisticInfo(product: {
  title: string;
  handle: string;
  price: Money;
  featuredImage: Image | null;
  defaultVariantSelectedOptions?: SelectedOption[];
}): OptimisticProductInfo {
  const opts = product.defaultVariantSelectedOptions ?? [];
  return {
    variantTitle: opts.map((o) => o.value).join(" / ") || "Default Title",
    productTitle: product.title,
    productHandle: product.handle,
    price: product.price,
    image: product.featuredImage || {
      url: "",
      altText: product.title,
      width: 0,
      height: 0,
    },
    selectedOptions: opts,
  };
}

// Build OptimisticProductInfo from a PDP variant + product
export function variantToOptimisticInfo(
  variant: {
    title: string;
    price: Money;
    image: Image | null;
    selectedOptions: SelectedOption[];
  },
  product: { title: string; handle: string; featuredImage: Image | null },
): OptimisticProductInfo {
  return {
    variantTitle: variant.title,
    productTitle: product.title,
    productHandle: product.handle,
    price: variant.price,
    image: variant.image ||
      product.featuredImage || {
        url: "",
        altText: product.title,
        width: 0,
        height: 0,
      },
    selectedOptions: variant.selectedOptions,
  };
}
