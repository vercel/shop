import { getSelectedProductOptions, type ProductInput } from "@shopify/hydrogen";

import type {
  Image,
  Money,
  OptionValueSwatch,
  ProductDetails,
  ProductOption,
  ProductVariant,
  SelectedOption,
} from "@/lib/types";

export type SelectedOptions = Record<string, string>;

// URLs carry lowercased option names and values; canonicalize both against the product before Shopify sees them.
export function parseSelectedOptions(
  options: ProductOption[],
  searchParams: Record<string, string | string[] | undefined>,
): SelectedOptions {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value !== undefined) params.set(key, value);
  }
  const optionsByLowerName = new Map(options.map((option) => [option.name.toLowerCase(), option]));
  const selected: SelectedOptions = {};
  for (const { name, value } of getSelectedProductOptions({ searchParams: params })) {
    const option = optionsByLowerName.get(name.toLowerCase());
    if (!option) continue;
    const match = option.values.find((v) => v.name.toLowerCase() === value.toLowerCase());
    selected[option.name] = match?.name ?? value;
  }
  return selected;
}

export type ProductFormVariant = Pick<
  ProductVariant,
  "availableForSale" | "compareAtPrice" | "id" | "image" | "price" | "selectedOptions" | "title"
> & {
  product: { handle: string; title: string };
  requiresBundleConfiguration: boolean;
};

// The store only forwards `swatch` per value, so the variant thumbnail rides along with it.
export interface ProductFormSwatch extends OptionValueSwatch {
  variantImage?: string;
}

export type ProductFormInput = ProductInput<ProductFormVariant> & {
  options: Array<{
    name: string;
    optionValues: Array<{
      firstSelectableVariant: ProductFormVariant | null;
      name: string;
      swatch?: ProductFormSwatch;
    }>;
  }>;
};

interface OptionValueState {
  available: boolean;
  crossProduct: boolean;
  exists: boolean;
  href: string;
  image?: string;
  name: string;
  selected: boolean;
  swatch?: OptionValueSwatch;
}

export interface OptionGroupState {
  name: string;
  values: OptionValueState[];
}

export function toStaticOptionGroups(product: ProductDetails): OptionGroupState[] {
  return product.options.map((option) => ({
    name: option.name,
    values: option.values.map((value) => ({
      available: true,
      crossProduct: false,
      exists: true,
      href: buildProductUrl(product.handle, [{ name: option.name, value: value.name }]),
      image: value.image,
      name: value.name,
      selected: false,
      swatch: value.swatch,
    })),
  }));
}

// Customized bundle parents have no fixed components; only their gating boolean crosses the client boundary.
export function toProductFormVariant(variant: ProductVariant): ProductFormVariant {
  return {
    availableForSale: variant.availableForSale,
    compareAtPrice: variant.compareAtPrice,
    id: variant.id,
    image: variant.image,
    price: variant.price,
    product: { handle: variant.productHandle, title: variant.productTitle },
    requiresBundleConfiguration: variant.requiresComponents && variant.components.length === 0,
    selectedOptions: variant.selectedOptions,
    title: variant.title,
  };
}

// The store seeds its selection from selectedOrFirstAvailableVariant, so the URL-resolved variant goes there.
export function toProductFormInput(
  product: ProductDetails,
  selectedVariant: ProductVariant | undefined,
): ProductFormInput {
  return {
    adjacentVariants: product.adjacentVariants.map(toProductFormVariant),
    encodedVariantAvailability: product.encodedVariantAvailability ?? null,
    encodedVariantExistence: product.encodedVariantExistence ?? null,
    handle: product.handle,
    id: product.id,
    options: product.options.map((option) => ({
      name: option.name,
      optionValues: option.values.map((value) => ({
        firstSelectableVariant: value.firstSelectableVariant
          ? toProductFormVariant(value.firstSelectableVariant)
          : null,
        name: value.name,
        swatch:
          value.swatch || value.image ? { ...value.swatch, variantImage: value.image } : undefined,
      })),
    })),
    priceRange: product.priceRange,
    selectedOrFirstAvailableVariant: selectedVariant ? toProductFormVariant(selectedVariant) : null,
    title: product.title,
    vendor: product.vendor ?? null,
  };
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

export function buildProductUrl(handle: string, selectedOptions: SelectedOption[]): string {
  const parts = selectedOptions.map(
    ({ name, value }) => `${encodeURIComponent(name.toLowerCase())}=${encodeURIComponent(value)}`,
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
