import { parseImagePlaceholders } from "@/lib/shopify/transforms/image-placeholders";
import { flattenEdges, getNumericShopifyId, type ShopifyEdges } from "@/lib/shopify/utils";
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

interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

interface ShopifyBundleComponentVariant {
  id: string;
  title: string;
  image: ShopifyImage | null;
  product: {
    id: string;
    title: string;
    handle: string;
    featuredImage: ShopifyImage | null;
  };
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: Array<{ name: string; value: string }>;
  image: ShopifyImage | null;
  requiresComponents?: boolean;
  groupedBy?: { nodes: ShopifyBundleComponentVariant[] };
  components?: {
    nodes: Array<{ quantity: number; productVariant: ShopifyBundleComponentVariant }>;
  };
}

interface ShopifyOptionValueSwatch {
  color: string | null;
  image: { previewImage: { url: string } } | null;
}

interface ShopifyOptionValue {
  id: string;
  name: string;
  swatch: ShopifyOptionValueSwatch | null;
  firstSelectableVariant?: {
    image: ShopifyImage | null;
    selectedOptions?: Array<{ name: string; value: string }>;
  } | null;
}

interface ShopifyOption {
  id: string;
  name: string;
  values: string[];
  optionValues?: ShopifyOptionValue[];
}

interface ShopifyCategory {
  id: string;
  name: string;
  ancestors: Array<{ id: string; name: string }>;
}

interface ShopifyVideoSource {
  url: string;
  mimeType: string;
  width: number;
  height: number;
}

interface ShopifyMediaImageNode {
  id: string;
  image: ShopifyImage | null;
  mediaContentType: "IMAGE";
}

interface ShopifyVideoNode {
  mediaContentType: "VIDEO";
  previewImage: ShopifyImage | null;
  sources: ShopifyVideoSource[];
}

interface ShopifyOtherMediaNode {
  mediaContentType: "EXTERNAL_VIDEO" | "MODEL_3D";
}

type ShopifyMediaNode = ShopifyMediaImageNode | ShopifyVideoNode | ShopifyOtherMediaNode;

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  tags: string[];
  updatedAt: string;
  availableForSale: boolean;
  isGiftCard: boolean;
  featuredImage: ShopifyImage | null;
  media?: ShopifyEdges<ShopifyMediaNode>;
  /** @deprecated Kept for stale cache compatibility — new queries use `media` */
  images?: ShopifyEdges<ShopifyImage>;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  compareAtPriceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  } | null;
  encodedVariantAvailability?: string | null;
  encodedVariantExistence?: string | null;
  variantsCount: { count: number };
  imagePlaceholders?: { jsonValue: unknown } | null;
  reviewsRating?: { value: string } | null;
  reviewsRatingCount?: { value: string } | null;
  selectedOrFirstAvailableVariant?: ShopifyVariant | null;
  variants?: ShopifyEdges<ShopifyVariant>;
  options: ShopifyOption[];
  seo: {
    title: string | null;
    description: string | null;
  };
  category?: ShopifyCategory | null;
  collections?: ShopifyEdges<{ handle: string }>;
}

export interface ShopifyProductCard {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  availableForSale: boolean;
  isGiftCard: boolean;
  featuredImage: ShopifyImage | null;
  images?: ShopifyEdges<ShopifyImage>;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  compareAtPriceRange?: {
    minVariantPrice: ShopifyMoney;
  } | null;
  selectedOrFirstAvailableVariant?: {
    id: string;
    availableForSale: boolean;
    image?: ShopifyImage | null;
    selectedOptions: Array<{ name: string; value: string }>;
  } | null;
  options?: Array<Pick<ShopifyOption, "name" | "optionValues">>;
}

function transformImage(image: ShopifyImage | null, blurDataURL?: string): Image | null {
  if (!image) return null;
  return {
    altText: image.altText ?? "",
    ...(blurDataURL ? { blurDataURL } : {}),
    height: image.height,
    url: image.url,
    width: image.width,
  };
}

function extractMediaFromProduct(product: ShopifyProduct): {
  images: Image[];
  videos: Video[];
} {
  // Handle stale cached responses that still use the old `images` field
  if (!product.media && product.images) {
    return {
      images: flattenEdges(product.images)
        .map((img) => transformImage(img))
        .filter(Boolean) as Image[],
      videos: [],
    };
  }

  if (!product.media) {
    return { images: [], videos: [] };
  }

  const images: Image[] = [];
  const placeholders = parseImagePlaceholders(product.imagePlaceholders?.jsonValue);
  const videos: Video[] = [];

  for (const node of flattenEdges(product.media)) {
    if (node.mediaContentType === "IMAGE") {
      const img = transformImage(node.image, placeholders.get(node.id)?.blurDataURL);
      if (img) images.push(img);
    } else if (node.mediaContentType === "VIDEO") {
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
    selectedOptions: variant.selectedOptions,
    image: transformImage(variant.image),
    bundleParents: variant.groupedBy?.nodes.map(transformVariantReference) ?? [],
    components: variant.components?.nodes.map(transformBundleComponent) ?? [],
    requiresComponents: variant.requiresComponents ?? false,
  };
}

function transformSwatch(swatch: ShopifyOptionValueSwatch | null): OptionValueSwatch | undefined {
  if (!swatch) return undefined;
  const result: OptionValueSwatch = {};
  if (swatch.color) result.color = swatch.color;
  if (swatch.image?.previewImage?.url) result.image = swatch.image.previewImage.url;
  if (!result.color && !result.image) return undefined;
  return result;
}

function transformOption(option: ShopifyOption): ProductOption {
  const swatchLookup = new Map<string, OptionValueSwatch | undefined>();
  const imageLookup = new Map<string, string | undefined>();
  if (option.optionValues) {
    for (const ov of option.optionValues) {
      swatchLookup.set(ov.name, transformSwatch(ov.swatch));
      imageLookup.set(ov.name, ov.firstSelectableVariant?.image?.url);
    }
  }

  return {
    id: option.id,
    name: option.name,
    values: option.values.map((value): OptionValue => ({
      id: value,
      image: imageLookup.get(value),
      name: value,
      swatch: swatchLookup.get(value),
    })),
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
      option.optionValues?.some((value) => value.swatch?.color || value.swatch?.image),
  );
  const matchedVariant = colorOption?.optionValues?.find(
    (value) => value.name.toLowerCase() === selectedOptionValue?.toLowerCase(),
  )?.firstSelectableVariant;
  const cardVariant = matchedVariant ?? defaultVariant;
  const primaryImage = matchedVariant?.image ?? product.featuredImage;
  const altImage = matchedVariant
    ? product.featuredImage?.url !== primaryImage?.url
      ? product.featuredImage
      : (product.images ? flattenEdges(product.images) : []).find(
          (image) => image.url !== primaryImage?.url,
        )
    : (product.images ? flattenEdges(product.images) : []).find(
        (image) => image.url !== primaryImage?.url,
      );

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: transformImage(primaryImage),
    secondaryImage: altImage ? transformImage(altImage) : undefined,
    price: product.priceRange.minVariantPrice,
    maxPrice: product.priceRange.maxVariantPrice,
    compareAtPrice: product.compareAtPriceRange?.minVariantPrice ?? undefined,
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
  if (!compareAtPriceRange) return true;
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
    ? flattenEdges(product.variants).map(transformVariant)
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
    compareAtPrice: product.compareAtPriceRange?.minVariantPrice ?? undefined,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
    isGiftCard: product.isGiftCard,
    allVariantsInStock:
      !product.encodedVariantExistence ||
      product.encodedVariantExistence === product.encodedVariantAvailability,
    hasUniformPricing: hasUniformPriceRange(product),
    variantsCount: product.variantsCount.count,
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
    compareAtPriceRange: product.compareAtPriceRange ?? undefined,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
    manufacturerName: product.vendor,
    categoryId: product.category?.id,
    collectionHandles: flattenEdges(product.collections ?? { edges: [] }).map((c) => c.handle),
    rating: transformReviewsRating(product),
  };
}

export function transformShopifyProductCards(products: ShopifyProductCard[]): ProductCard[] {
  return products.map(transformShopifyProductCard);
}
