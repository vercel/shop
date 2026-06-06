import type {
  Image,
  Money,
  ProductDetails,
  ProductOption,
  ProductSelectionData,
  ProductVariant,
  SelectedOption,
} from "@/lib/types";

export type SelectedOptions = Record<string, string>;

export interface ProductSelection extends ProductSelectionData {
  selectedOptions: SelectedOptions;
  colorImages: Image[];
}

export function computeSelection(
  product: ProductDetails,
  selectionData?: ProductSelectionData,
): ProductSelection {
  const selectedVariant =
    selectionData?.selectedVariant ??
    product.variants.find((variant) => variant.id === product.defaultVariantId) ??
    product.variants[0];
  const options = selectionData?.options ?? product.options;
  const variants = mergeVariants(product.variants, selectionData?.variants ?? []);
  const selectedOptions = selectedOptionsToRecord(selectedVariant?.selectedOptions ?? []);
  const colorImages = hasColorImagePartitioning(options, variants)
    ? getPartitionedImagesForSelectedColor(product.images, options, variants, selectedOptions)
        .colorImages
    : [];
  return { selectedOptions, selectedVariant, colorImages, options, variants };
}

function mergeVariants(...groups: ProductVariant[][]): ProductVariant[] {
  const variants = new Map<string, ProductVariant>();
  for (const group of groups) {
    for (const variant of group) {
      variants.set(variant.id, variant);
    }
  }
  return [...variants.values()];
}

function selectedOptionsToRecord(options: SelectedOption[]): SelectedOptions {
  return Object.fromEntries(options.map((option) => [option.name, option.value]));
}

export function getSelectedOptionsFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): SelectedOption[] {
  return Object.entries(searchParams)
    .filter(([name]) => !isIgnoredProductSearchParam(name))
    .map(([name, rawValue]) => {
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
      return value ? { name, value } : null;
    })
    .filter((option): option is SelectedOption => option !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function isIgnoredProductSearchParam(name: string): boolean {
  const normalizedName = name.toLowerCase();
  return (
    normalizedName === "_gl" ||
    normalizedName === "dclid" ||
    normalizedName === "fbclid" ||
    normalizedName === "gclid" ||
    normalizedName === "msclkid" ||
    normalizedName === "variant" ||
    normalizedName.startsWith("utm_")
  );
}

function findSelectedVariant(variants: ProductVariant[], selectedOptions: SelectedOptions) {
  return variants.find((variant) =>
    variant.selectedOptions.every((option) => selectedOptions[option.name] === option.value),
  );
}

/**
 * Falls back to all product images when no color option exists, only one color
 * is available, or no variant images are assigned.
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

  if (colorToImageUrls.size === 0) return images;

  const otherColorImageUrls = new Set<string>();
  for (const [color, urls] of colorToImageUrls) {
    if (color !== selectedColor) {
      for (const url of urls) {
        otherColorImageUrls.add(url);
      }
    }
  }

  // Images shared with the selected color must not be excluded.
  const selectedColorUrls = colorToImageUrls.get(selectedColor);
  if (selectedColorUrls) {
    for (const url of selectedColorUrls) {
      otherColorImageUrls.delete(url);
    }
  }

  const filtered = images.filter((img) => !otherColorImageUrls.has(img.url));

  if (filtered.length === 0) return images;

  const colorImages: typeof filtered = [];
  const sharedImages: typeof filtered = [];

  for (const img of filtered) {
    if (selectedColorUrls?.has(img.url)) {
      colorImages.push(img);
    } else {
      sharedImages.push(img);
    }
  }

  const selectedVariant = findSelectedVariant(variants, selectedOptions);
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

  if (colorOption.values.length <= 1) return { colorImages: images, otherImages: [] };

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

  if (colorToImageUrls.size === 0) return { colorImages: [], otherImages: images };

  const otherColorImageUrls = new Set<string>();
  for (const [color, urls] of colorToImageUrls) {
    if (color !== selectedColor) {
      for (const url of urls) {
        otherColorImageUrls.add(url);
      }
    }
  }

  // Images shared with the selected color must not be excluded.
  const selectedColorUrls = colorToImageUrls.get(selectedColor);
  if (selectedColorUrls) {
    for (const url of selectedColorUrls) {
      otherColorImageUrls.delete(url);
    }
  }

  const filtered = images.filter((img) => !otherColorImageUrls.has(img.url));

  if (filtered.length === 0) return { colorImages: [], otherImages: images };

  const colorImages: Image[] = [];
  const otherImages: Image[] = [];

  for (const img of filtered) {
    if (selectedColorUrls?.has(img.url)) {
      colorImages.push(img);
    } else {
      otherImages.push(img);
    }
  }

  const selectedVariant = findSelectedVariant(variants, selectedOptions);
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

/** True when the gallery depends on selected color (i.e. on searchParams). */
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
    (v) => v.image && v.selectedOptions.some((opt) => opt.name === colorOption.name),
  );
}

/** Images not assigned to any color variant — can render without waiting for searchParams. */
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
    const colorOpt = variant.selectedOptions.find((opt) => opt.name === colorOption.name);
    if (colorOpt) {
      allColorImageUrls.add(variant.image.url);
    }
  }

  if (allColorImageUrls.size === 0) return images;

  return images.filter((img) => !allColorImageUrls.has(img.url));
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
