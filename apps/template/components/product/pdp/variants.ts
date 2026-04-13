import type { Image, ProductOption, ProductVariant } from "@/lib/types";

export type SelectedOptions = Record<string, string>;

/**
 * Extract the numeric ID from a Shopify GID string.
 * e.g. "gid://shopify/ProductVariant/1234567890" → "1234567890"
 *
 * Handles both raw GID strings and base64-encoded GIDs.
 * Returns `null` if the ID cannot be extracted.
 */
export function getNumericShopifyId(gid: string): string | null {
  let decoded = gid;

  // If it doesn't look like a GID, try base64 decoding
  if (!decoded.startsWith("gid://")) {
    try {
      decoded = atob(decoded);
    } catch {
      return null;
    }
  }

  const match = decoded.match(/gid:\/\/shopify\/\w+\/(\d+)/);
  return match?.[1] ?? null;
}

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
      opt.values.some((v) => v.swatch?.color) ||
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
      opt.values.some((v) => v.swatch?.color) ||
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
