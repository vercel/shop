import type {
  Image,
  Money,
  ProductDetails,
  ProductOption,
  ProductVariant,
  SelectedOption,
} from "@/lib/types";

export type SelectedOptions = Record<string, string>;

export interface ProductSelection {
  selectedOptions: SelectedOptions;
  selectedVariant: ProductVariant | undefined;
}

/** Selected options from `?color=Blue&size=XS` params, keyed by canonical option name. */
export function parseSelectedOptions(
  options: ProductOption[],
  searchParams: Record<string, string | string[] | undefined>,
): SelectedOptions {
  const selected: SelectedOptions = {};
  for (const option of options) {
    const raw = searchParams[option.name.toLowerCase()];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined) continue;
    const match = option.values.find((v) => v.name.toLowerCase() === value.toLowerCase());
    selected[option.name] = match?.name ?? value;
  }
  return selected;
}

/** The default variant's options — the selection shown when no params are present. */
export function defaultSelectedOptions(product: ProductDetails): SelectedOptions {
  const selected: SelectedOptions = {};
  for (const option of product.defaultVariant?.selectedOptions ??
    product.defaultVariantSelectedOptions ??
    []) {
    selected[option.name] = option.value;
  }
  return selected;
}

export function toSelectedOptionList(selectedOptions: SelectedOptions): SelectedOption[] {
  return Object.entries(selectedOptions).map(([name, value]) => ({ name, value }));
}

/** Option-based PDP URL, e.g. `/products/handle?color=Blue&size=XS`. */
export function buildOptionUrl(
  handle: string,
  currentOptions: SelectedOptions,
  optionName: string,
  optionValue: string,
): string {
  const next = { ...currentOptions, [optionName]: optionValue };
  const parts = Object.entries(next).map(
    ([name, value]) => `${encodeURIComponent(name.toLowerCase())}=${encodeURIComponent(value)}`,
  );
  return parts.length > 0 ? `/products/${handle}?${parts.join("&")}` : `/products/${handle}`;
}

/** Representative variant images (one per option value, from firstSelectableVariant). */
function colorImageUrls(options: ProductOption[]): Set<string> {
  const urls = new Set<string>();
  for (const option of options) {
    for (const value of option.values) {
      if (value.image) urls.add(value.image);
    }
  }
  return urls;
}

/** True when the gallery should lead with a color-specific (selected-variant) image. */
export function hasColorImagePartitioning(options: ProductOption[]): boolean {
  return options.some((option) => option.values.filter((value) => value.image).length > 1);
}

/** Product images that aren't a specific color's representative image. */
export function getSharedImages(images: Image[], options: ProductOption[]): Image[] {
  const colorUrls = colorImageUrls(options);
  if (colorUrls.size === 0) return images;
  const shared = images.filter((image) => !colorUrls.has(image.url));
  return shared.length > 0 ? shared : images;
}

/** When true, the price renders without waiting for searchParams to resolve the variant. */
export function hasUniformPricing(
  priceRange: ProductDetails["priceRange"],
  compareAtPriceRange?: ProductDetails["compareAtPriceRange"],
): boolean {
  const { maxVariantPrice, minVariantPrice } = priceRange;
  const priceUniform =
    minVariantPrice.amount === maxVariantPrice.amount &&
    minVariantPrice.currencyCode === maxVariantPrice.currencyCode;
  if (!priceUniform) return false;
  if (!compareAtPriceRange) return true;
  return compareAtPriceRange.minVariantPrice.amount === compareAtPriceRange.maxVariantPrice.amount;
}

/**
 * True when every existing option combination is in stock, so buy-button labels
 * can render in the Suspense fallback without resolving the variant. Derived from
 * the encoded availability/existence tries (equal ⇒ nothing is sold out).
 */
export function hasUniformStock(product: ProductDetails): boolean {
  const { encodedVariantAvailability, encodedVariantExistence } = product;
  if (!encodedVariantExistence) return true;
  return encodedVariantAvailability === encodedVariantExistence;
}

export type OptimisticProductInfo = {
  variantTitle: string;
  productTitle: string;
  productHandle: string;
  price: Money;
  image: Image;
  selectedOptions: SelectedOption[];
};

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
