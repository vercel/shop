import type { Image, Money, ProductDetails, ProductOption, SelectedOption } from "@/lib/types";

export type SelectedOptions = Record<string, string>;

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

function findColorOption(options: ProductOption[]): ProductOption | undefined {
  return options.find(
    (option) =>
      option.values.some((value) => value.swatch?.color || value.swatch?.image) ||
      option.name.toLowerCase().includes("color"),
  );
}

// Only color partitions the gallery; other option axes share imagery.
export function hasColorImagePartitioning(options: ProductOption[]): boolean {
  const color = findColorOption(options);
  if (!color || color.values.length <= 1) return false;
  return color.values.filter((value) => value.image).length > 1;
}

export function getSharedImages(images: Image[], options: ProductOption[]): Image[] {
  const color = findColorOption(options);
  if (!color) return images;
  const colorUrls = new Set(
    color.values.map((value) => value.image).filter((url): url is string => Boolean(url)),
  );
  if (colorUrls.size === 0) return images;
  const shared = images.filter((image) => !colorUrls.has(image.url));
  return shared.length > 0 ? shared : images;
}

export function getSelectedColorImage(
  product: ProductDetails,
  selectedOptions: SelectedOptions,
): Image | undefined {
  const color = findColorOption(product.options);
  if (!color) return undefined;
  const value = color.values.find((v) => v.name === selectedOptions[color.name]);
  if (!value?.image) return undefined;
  return (
    product.images.find((image) => image.url === value.image) ?? {
      url: value.image,
      altText: product.title,
      width: 0,
      height: 0,
    }
  );
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
