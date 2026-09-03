import { flattenConnection } from "@shopify/hydrogen";

import type {
  BUNDLE_COMPONENT_VARIANT_FRAGMENT,
  FILTERABLE_PRODUCT_CARD_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_FRAGMENT,
  PRODUCT_VARIANT_FRAGMENT,
  PRODUCT_WITH_VARIANTS_FRAGMENT,
  PURCHASABLE_PRODUCT_VARIANT_FRAGMENT,
  TAXONOMY_CATEGORY_FRAGMENT,
} from "@/lib/shopify/fragments";
import type { ResultOf } from "@/lib/shopify/storefront";
import { parseImagePlaceholders } from "@/lib/shopify/transforms/image-placeholders";
import { getNumericShopifyId } from "@/lib/shopify/utils";
import type {
  Category,
  Image,
  OptionValue,
  OptionValueSwatch,
  ProductCard,
  ProductDetails,
  ProductOption,
  ProductRating,
  ProductVariant,
  ProductVariantComponent,
  ProductVariantReference,
  Video,
} from "@/lib/types";

type ShopifyBundleComponentVariant = ResultOf<typeof BUNDLE_COMPONENT_VARIANT_FRAGMENT>;
type ShopifyImage = NonNullable<ShopifyBundleComponentVariant["image"]>;
type ShopifyBaseVariant = ResultOf<typeof PRODUCT_VARIANT_FRAGMENT>;
type ShopifyPurchasableVariant = ResultOf<typeof PURCHASABLE_PRODUCT_VARIANT_FRAGMENT>;
// Bundle fields are only selected when `shopConfig.pdp.bundles.isEnabled`.
export type ShopifyVariant = ShopifyBaseVariant & Partial<ShopifyPurchasableVariant>;
type ShopifyCategory = ResultOf<typeof TAXONOMY_CATEGORY_FRAGMENT>;

type ShopifyBaseProduct = ResultOf<typeof PRODUCT_FRAGMENT>;
type ShopifyProductWithVariants = ResultOf<typeof PRODUCT_WITH_VARIANTS_FRAGMENT>;
// Variants and bundle relationships are optional selections layered on ProductFields.
export type ShopifyProduct = ShopifyBaseProduct &
  Partial<Pick<ShopifyProductWithVariants, "variants">> & {
    selectedOrFirstAvailableVariant?: ShopifyVariant | null;
  };
type ShopifyOption = ShopifyProduct["options"][number];
type ShopifyOptionValueSwatch = ShopifyOption["optionValues"][number]["swatch"];
type ShopifyMediaNode = ShopifyProduct["media"]["edges"][number]["node"];

type ShopifyBaseProductCard = ResultOf<typeof PRODUCT_CARD_FRAGMENT>;
type ShopifyFilterableProductCard = ResultOf<typeof FILTERABLE_PRODUCT_CARD_FRAGMENT>;
export type ShopifyProductCard = ShopifyBaseProductCard &
  Partial<Pick<ShopifyFilterableProductCard, "options">>;

export function transformImage(
  image: ShopifyImage | null | undefined,
  blurDataURL?: string,
): Image | null {
  if (!image) return null;
  return {
    url: image.url,
    altText: image.altText ?? "",
    width: image.width ?? 0,
    height: image.height ?? 0,
    ...(blurDataURL ? { blurDataURL } : {}),
  };
}

function extractMediaFromProduct(product: ShopifyProduct): {
  images: Image[];
  videos: Video[];
} {
  const images: Image[] = [];
  const placeholders = parseImagePlaceholders(product.imagePlaceholders?.jsonValue);
  const videos: Video[] = [];

  for (const node of flattenConnection<ShopifyMediaNode>(product.media)) {
    if (node.__typename === "MediaImage") {
      const img = transformImage(node.image, placeholders.get(node.id)?.blurDataURL);
      if (img) images.push(img);
    } else if (node.__typename === "Video") {
      const mp4Sources = node.sources.filter((s) => s.mimeType.startsWith("video/mp4"));
      const bestSource = mp4Sources.sort((a, b) => b.width - a.width)[0] ?? node.sources[0];
      if (bestSource) {
        videos.push({
          url: bestSource.url,
          previewImage: transformImage(node.previewImage),
          width: bestSource.width,
          height: bestSource.height,
        });
      }
    }
  }

  return { images, videos };
}

function transformCategory(category: ShopifyCategory | null | undefined): Category | null {
  if (!category) return null;
  const cappedAncestors = category.ancestors.slice(-2);
  return {
    id: category.id,
    name: category.name,
    ancestors: cappedAncestors.map((a) => ({
      id: a.id,
      name: a.name,
      ancestors: [],
    })),
  };
}

function transformVariantReference(
  variant: ShopifyBundleComponentVariant,
): ProductVariantReference {
  return {
    id: variant.id,
    image: transformImage(variant.image),
    product: {
      featuredImage: transformImage(variant.product.featuredImage),
      handle: variant.product.handle,
      id: variant.product.id,
      title: variant.product.title,
    },
    title: variant.title,
  };
}

function transformBundleComponent(component: {
  quantity: number;
  productVariant: ShopifyBundleComponentVariant;
}): ProductVariantComponent {
  return {
    quantity: component.quantity,
    variant: transformVariantReference(component.productVariant),
  };
}

export function transformVariant(variant: ShopifyVariant): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    productHandle: variant.product.handle,
    productTitle: variant.product.title,
    selectedOptions: variant.selectedOptions,
    image: transformImage(variant.image),
    bundleParents: variant.groupedBy?.nodes.map(transformVariantReference) ?? [],
    components: variant.components?.nodes.map(transformBundleComponent) ?? [],
    requiresComponents: variant.requiresComponents ?? false,
  };
}

function transformSwatch(swatch: ShopifyOptionValueSwatch): OptionValueSwatch | undefined {
  if (!swatch) return undefined;
  const result: OptionValueSwatch = {};
  if (swatch.color) result.color = swatch.color;
  if (swatch.image?.previewImage?.url) result.image = swatch.image.previewImage.url;
  if (!result.color && !result.image) return undefined;
  return result;
}

function transformOption(option: ShopifyOption): ProductOption {
  const swatchLookup = new Map<string, OptionValueSwatch | undefined>();
  const variantLookup = new Map<string, ProductVariant | undefined>();
  for (const ov of option.optionValues) {
    swatchLookup.set(ov.name, transformSwatch(ov.swatch));
    variantLookup.set(
      ov.name,
      ov.firstSelectableVariant ? transformVariant(ov.firstSelectableVariant) : undefined,
    );
  }

  return {
    id: option.id,
    name: option.name,
    values: option.values.map((value): OptionValue => {
      const firstSelectableVariant = variantLookup.get(value);
      return {
        firstSelectableVariant,
        id: value,
        image: firstSelectableVariant?.image?.url,
        name: value,
        swatch: swatchLookup.get(value),
      };
    }),
  };
}

function transformProductCard(
  product: ShopifyProductCard,
  selectedOptionValue?: string,
): ProductCard {
  const defaultVariant = product.selectedOrFirstAvailableVariant;
  const colorOption = product.options?.find(
    (option) =>
      option.name.toLowerCase().includes("colo") ||
      option.optionValues.some((value) => value.swatch?.color || value.swatch?.image),
  );
  const matchedVariant = colorOption?.optionValues.find(
    (value) => value.name.toLowerCase() === selectedOptionValue?.toLowerCase(),
  )?.firstSelectableVariant;
  const cardVariant = matchedVariant ?? defaultVariant;
  const primaryImage = matchedVariant?.image ?? product.featuredImage;
  const images = flattenConnection(product.images);
  const colorVariantImageUrls = new Set(
    colorOption?.optionValues
      ?.map((value) => value.firstSelectableVariant?.image?.url)
      .filter((url): url is string => !!url),
  );
  const altImage = matchedVariant
    ? images.find((image) => !colorVariantImageUrls.has(image.url))
    : images.find((image) => image.url !== primaryImage?.url);

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: transformImage(primaryImage),
    secondaryImage: altImage ? transformImage(altImage) : undefined,
    price: product.priceRange.minVariantPrice,
    maxPrice: product.priceRange.maxVariantPrice,
    compareAtPrice: product.compareAtPriceRange.minVariantPrice,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
    isGiftCard: product.isGiftCard,
    defaultVariantId: defaultVariant?.id,
    defaultVariantNumericId: defaultVariant
      ? (getNumericShopifyId(defaultVariant.id) ?? undefined)
      : undefined,
    defaultVariantSelectedOptions: cardVariant?.selectedOptions ?? [],
  };
}

export function transformFilteredShopifyProductCard(
  product: ShopifyProductCard,
  selectedOptionValue?: string,
): ProductCard {
  return transformProductCard(product, selectedOptionValue);
}

export function transformShopifyProductCard(product: ShopifyProductCard): ProductCard {
  return transformProductCard(product);
}

function hasUniformPriceRange(product: ShopifyProduct): boolean {
  const { compareAtPriceRange, priceRange } = product;
  if (priceRange.minVariantPrice.amount !== priceRange.maxVariantPrice.amount) return false;
  if (priceRange.minVariantPrice.currencyCode !== priceRange.maxVariantPrice.currencyCode) {
    return false;
  }
  return compareAtPriceRange.minVariantPrice.amount === compareAtPriceRange.maxVariantPrice.amount;
}

// reviews.rating stores JSON like {"value":"4.5","scale_min":"1.0","scale_max":"5.0"};
// reviews.rating_count stores a bare integer string. Either can be absent when unrated.
function transformReviewsRating(product: ShopifyProduct): ProductRating | undefined {
  const countRaw = product.reviewsRatingCount?.value;
  if (!countRaw) return undefined;
  const count = Number.parseInt(countRaw, 10);
  if (!Number.isFinite(count) || count <= 0) return undefined;
  let value = 0;
  try {
    const parsed = JSON.parse(product.reviewsRating?.value ?? "") as { value?: unknown };
    const v = Number(parsed?.value);
    if (Number.isFinite(v)) value = v;
  } catch {
    // value stays 0; count alone still renders "N reviews"
  }
  return { count, value };
}

export function transformShopifyProductDetails(product: ShopifyProduct): ProductDetails {
  const variants = product.variants
    ? flattenConnection(product.variants).map(transformVariant)
    : undefined;
  const defaultVariant = product.selectedOrFirstAvailableVariant
    ? transformVariant(product.selectedOrFirstAvailableVariant)
    : (variants?.find((v) => v.availableForSale) ?? variants?.[0]);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: transformImage(product.featuredImage),
    price: product.priceRange.minVariantPrice,
    maxPrice: product.priceRange.maxVariantPrice,
    compareAtPrice: product.compareAtPriceRange.minVariantPrice,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
    isGiftCard: product.isGiftCard,
    adjacentVariants: product.adjacentVariants.map(transformVariant),
    allVariantsInStock:
      !product.encodedVariantExistence ||
      product.encodedVariantExistence === product.encodedVariantAvailability,
    hasUniformPricing: hasUniformPriceRange(product),
    variantsCount: product.variantsCount?.count ?? variants?.length ?? 0,
    defaultVariant,
    defaultVariantId: defaultVariant?.id,
    defaultVariantNumericId: defaultVariant
      ? (getNumericShopifyId(defaultVariant.id) ?? undefined)
      : undefined,
    defaultVariantSelectedOptions: defaultVariant?.selectedOptions ?? [],
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    encodedVariantAvailability: product.encodedVariantAvailability ?? undefined,
    encodedVariantExistence: product.encodedVariantExistence ?? undefined,
    ...extractMediaFromProduct(product),
    variants,
    options: product.options.map(transformOption),
    tags: product.tags,
    seo: {
      title: product.seo.title || product.title,
      description: product.seo.description || product.description,
    },
    category: transformCategory(product.category),
    updatedAt: product.updatedAt,
    priceRange: product.priceRange,
    compareAtPriceRange: product.compareAtPriceRange,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
    categoryId: product.category?.id,
    collectionHandles: flattenConnection(product.collections).map((c) => c.handle),
    rating: transformReviewsRating(product),
  };
}
