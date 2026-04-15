import type { Image, Money, ProductOption, ProductVariant, SelectedOption } from "@/lib/types";
import { getNumericShopifyId } from "@/lib/shopify/utils";

// ── Variant selection ────────────────────────────────────────────────

export type SelectedOptions = Record<string, string>;

/**
 * Compute initial selected options based on variantId and available variants.
 * Called server-side so the initial HTML matches hydrated state (zero CLS).
 */
export function computeInitialSelectedOptions(
  variants: ProductVariant[],
  initialVariantId?: string,
): SelectedOptions {
  if (initialVariantId) {
    const matchedVariant = variants.find((v) => {
      const numericId = getNumericShopifyId(v.id);
      return numericId === initialVariantId;
    });
    if (matchedVariant) {
      const opts: SelectedOptions = {};
      for (const opt of matchedVariant.selectedOptions) {
        opts[opt.name] = opt.value;
      }
      return opts;
    }
  }
  return getInitialSelectedOptions(variants);
}

export function getInitialSelectedOptions(variants: ProductVariant[]): SelectedOptions {
  const initial: SelectedOptions = {};
  for (const option of variants[0]?.selectedOptions ?? []) {
    initial[option.name] = option.value;
  }
  return initial;
}

export function resolveSelectedVariant(
  variants: ProductVariant[],
  selectedOptions: SelectedOptions,
) {
  if (Object.keys(selectedOptions).length === 0) {
    return variants[0];
  }

  return (
    variants.find((variant) =>
      variant.selectedOptions.every((option) => selectedOptions[option.name] === option.value),
    ) ?? variants[0]
  );
}

/**
 * Compute the URL for selecting a given option value.
 * Finds the variant matching the updated options and returns
 * `/products/{handle}?variantId={numericId}`.
 */
export function getVariantUrl(
  handle: string,
  variants: ProductVariant[],
  currentOptions: SelectedOptions,
  optionName: string,
  optionValue: string,
): string {
  const newOptions = { ...currentOptions, [optionName]: optionValue };

  // Try exact match first
  let variant = variants.find((v) =>
    v.selectedOptions.every((opt) => newOptions[opt.name] === opt.value),
  );

  // Fall back to first variant with this option value
  if (!variant) {
    variant = variants.find((v) =>
      v.selectedOptions.some((opt) => opt.name === optionName && opt.value === optionValue),
    );
  }

  const numericId = variant ? getNumericShopifyId(variant.id) : null;
  if (numericId) {
    return `/products/${handle}?variantId=${numericId}`;
  }

  return `/products/${handle}`;
}

// ── Color image partitioning ─────────────────────────────────────────

/**
 * Returns filtered images for the currently selected color variant.
 *
 * Collects variant images assigned to other colors and excludes them,
 * keeping the selected color's variant image and all shared/unassigned images.
 *
 * Falls back to all product images when:
 * - No color option exists on the product
 * - Only one color is available
 * - No variant images are assigned
 */
export function getImagesForSelectedColor(
  images: Image[],
  options: ProductOption[],
  variants: ProductVariant[],
  selectedOptions: SelectedOptions,
): Image[] {
  // Find the color option using swatch data (locale-agnostic) first, then
  // fall back to the English name for stores without swatches configured.
  const colorOption = options.find(
    (opt) =>
      opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
      opt.name.toLowerCase().includes("color"),
  );

  if (!colorOption) return images;

  const selectedColor = selectedOptions[colorOption.name];
  if (!selectedColor) return images;

  // Only one color means all images belong to it
  if (colorOption.values.length <= 1) return images;

  // Collect variant image URLs for each color
  const colorToImageUrls = new Map<string, Set<string>>();
  for (const variant of variants) {
    if (!variant.image) continue;
    const colorOpt = variant.selectedOptions.find((opt) => opt.name === colorOption.name);
    if (!colorOpt) continue;

    let urls = colorToImageUrls.get(colorOpt.value);
    if (!urls) {
      urls = new Set<string>();
      colorToImageUrls.set(colorOpt.value, urls);
    }
    urls.add(variant.image.url);
  }

  // No variant images assigned — show all
  if (colorToImageUrls.size === 0) return images;

  // Collect image URLs belonging to other colors (not the selected one)
  const otherColorImageUrls = new Set<string>();
  for (const [color, urls] of colorToImageUrls) {
    if (color !== selectedColor) {
      for (const url of urls) {
        otherColorImageUrls.add(url);
      }
    }
  }

  // Don't exclude images that are shared with the selected color
  const selectedColorUrls = colorToImageUrls.get(selectedColor);
  if (selectedColorUrls) {
    for (const url of selectedColorUrls) {
      otherColorImageUrls.delete(url);
    }
  }

  const filtered = images.filter((img) => !otherColorImageUrls.has(img.url));

  if (filtered.length === 0) return images;

  // Partition: color-specific images first, then shared/unassigned images
  const colorImages: typeof filtered = [];
  const sharedImages: typeof filtered = [];

  for (const img of filtered) {
    if (selectedColorUrls?.has(img.url)) {
      colorImages.push(img);
    } else {
      sharedImages.push(img);
    }
  }

  // Within color images, move the selected variant's image to the front
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);
  const variantImageUrl = selectedVariant?.image?.url;

  if (variantImageUrl) {
    const variantIdx = colorImages.findIndex((img) => img.url === variantImageUrl);
    if (variantIdx > 0) {
      const [variantImage] = colorImages.splice(variantIdx, 1);
      colorImages.unshift(variantImage);
    }
  }

  return [...colorImages, ...sharedImages];
}

/**
 * Returns partitioned images for the currently selected color variant.
 *
 * Returns an object with:
 * - colorImages: Images specific to the selected color variant
 * - otherImages: Shared/unassigned images
 */
export function getPartitionedImagesForSelectedColor(
  images: Image[],
  options: ProductOption[],
  variants: ProductVariant[],
  selectedOptions: SelectedOptions,
): { colorImages: Image[]; otherImages: Image[] } {
  // Find the color option using swatch data (locale-agnostic) first, then
  // fall back to the English name for stores without swatches configured.
  const colorOption = options.find(
    (opt) =>
      opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
      opt.name.toLowerCase().includes("color"),
  );

  if (!colorOption) return { colorImages: [], otherImages: images };

  const selectedColor = selectedOptions[colorOption.name];
  if (!selectedColor) return { colorImages: [], otherImages: images };

  // Only one color means all images belong to it
  if (colorOption.values.length <= 1) return { colorImages: images, otherImages: [] };

  // Collect variant image URLs for each color
  const colorToImageUrls = new Map<string, Set<string>>();
  for (const variant of variants) {
    if (!variant.image) continue;
    const colorOpt = variant.selectedOptions.find((opt) => opt.name === colorOption.name);
    if (!colorOpt) continue;

    let urls = colorToImageUrls.get(colorOpt.value);
    if (!urls) {
      urls = new Set<string>();
      colorToImageUrls.set(colorOpt.value, urls);
    }
    urls.add(variant.image.url);
  }

  // No variant images assigned — all are "other"
  if (colorToImageUrls.size === 0) return { colorImages: [], otherImages: images };

  // Collect image URLs belonging to other colors (not the selected one)
  const otherColorImageUrls = new Set<string>();
  for (const [color, urls] of colorToImageUrls) {
    if (color !== selectedColor) {
      for (const url of urls) {
        otherColorImageUrls.add(url);
      }
    }
  }

  // Don't exclude images that are shared with the selected color
  const selectedColorUrls = colorToImageUrls.get(selectedColor);
  if (selectedColorUrls) {
    for (const url of selectedColorUrls) {
      otherColorImageUrls.delete(url);
    }
  }

  const filtered = images.filter((img) => !otherColorImageUrls.has(img.url));

  if (filtered.length === 0) return { colorImages: [], otherImages: images };

  // Partition: color-specific images vs shared/unassigned images
  const colorImages: Image[] = [];
  const otherImages: Image[] = [];

  for (const img of filtered) {
    if (selectedColorUrls?.has(img.url)) {
      colorImages.push(img);
    } else {
      otherImages.push(img);
    }
  }

  // Within color images, move the selected variant's image to the front
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);
  const variantImageUrl = selectedVariant?.image?.url;

  if (variantImageUrl) {
    const variantIdx = colorImages.findIndex((img) => img.url === variantImageUrl);
    if (variantIdx > 0) {
      const [variantImage] = colorImages.splice(variantIdx, 1);
      colorImages.unshift(variantImage);
    }
  }

  return { colorImages, otherImages };
}

/**
 * Returns true when all variants share the same price and compareAtPrice.
 * When true, we can render the price immediately without waiting for
 * searchParams to resolve the selected variant.
 */
export function hasUniformPricing(variants: ProductVariant[]): boolean {
  if (variants.length <= 1) return true;
  const first = variants[0];
  return variants.every(
    (v) =>
      v.price.amount === first.price.amount &&
      v.price.currencyCode === first.price.currencyCode &&
      v.compareAtPrice?.amount === first.compareAtPrice?.amount,
  );
}

/**
 * Returns true when the product has multiple color variants with
 * distinct images — meaning the gallery would change based on
 * the selected color (i.e. based on searchParams).
 */
export function hasColorImagePartitioning(
  options: ProductOption[],
  variants: ProductVariant[],
): boolean {
  const colorOption = options.find(
    (opt) =>
      opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
      opt.name.toLowerCase().includes("color"),
  );

  if (!colorOption || colorOption.values.length <= 1) return false;

  return variants.some(
    (v) =>
      v.image &&
      v.selectedOptions.some((opt) => opt.name === colorOption.name),
  );
}

/**
 * Returns images not assigned to any color variant.
 * These "shared" images can render without waiting for searchParams.
 */
export function getSharedImages(
  images: Image[],
  options: ProductOption[],
  variants: ProductVariant[],
): Image[] {
  const colorOption = options.find(
    (opt) =>
      opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
      opt.name.toLowerCase().includes("color"),
  );

  if (!colorOption || colorOption.values.length <= 1) return images;

  const allColorImageUrls = new Set<string>();
  for (const variant of variants) {
    if (!variant.image) continue;
    const colorOpt = variant.selectedOptions.find(
      (opt) => opt.name === colorOption.name,
    );
    if (colorOpt) {
      allColorImageUrls.add(variant.image.url);
    }
  }

  if (allColorImageUrls.size === 0) return images;

  return images.filter((img) => !allColorImageUrls.has(img.url));
}

// ── Optimistic cart info ─────────────────────────────────────────────

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
