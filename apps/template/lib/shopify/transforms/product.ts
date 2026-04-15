import { getNumericShopifyId } from "@/lib/shopify/utils";
import { flattenEdges, type ShopifyEdges } from "@/lib/shopify/utils";
import type {
  Category,
  Image,
  OptionValue,
  OptionValueSwatch,
  ProductCard,
  ProductDetails,
  ProductOption,
  ProductVariant,
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

interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: Array<{ name: string; value: string }>;
  image: ShopifyImage | null;
}

interface ShopifyOptionValueSwatch {
  color: string | null;
  image: { previewImage: { url: string } } | null;
}

interface ShopifyOptionValue {
  id: string;
  name: string;
  swatch: ShopifyOptionValueSwatch | null;
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

interface ShopifyMetafield {
  key: string;
  namespace: string;
  value: string;
  type: string;
}

interface ShopifyVideoSource {
  url: string;
  mimeType: string;
  width: number;
  height: number;
}

interface ShopifyMediaImageNode {
  mediaContentType: "IMAGE";
  image: ShopifyImage | null;
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
  variants: ShopifyEdges<ShopifyVariant>;
  options: ShopifyOption[];
  seo: {
    title: string | null;
    description: string | null;
  };
  category?: ShopifyCategory | null;
  collections?: ShopifyEdges<{ handle: string }>;
  metafields?: (ShopifyMetafield | null)[];
}

export interface ShopifyProductCard {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  priceRange: {
    minVariantPrice: ShopifyMoney;
  };
  compareAtPriceRange?: {
    minVariantPrice: ShopifyMoney;
  } | null;
  selectedOrFirstAvailableVariant?: {
    id: string;
    availableForSale: boolean;
    selectedOptions: Array<{ name: string; value: string }>;
  } | null;
}

function transformImage(image: ShopifyImage | null): Image | null {
  if (!image) return null;
  return {
    url: image.url,
    altText: image.altText ?? "",
    width: image.width,
    height: image.height,
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
  const videos: Video[] = [];

  for (const node of flattenEdges(product.media)) {
    if (node.mediaContentType === "IMAGE") {
      const img = transformImage(node.image);
      if (img) images.push(img);
    } else if (node.mediaContentType === "VIDEO") {
      // Pick the best mp4 source (largest width)
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
  // Cap to 3 levels (Shopify menu limit): keep only the last 2 ancestors
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

function transformVariant(variant: ShopifyVariant): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    selectedOptions: variant.selectedOptions,
    image: transformImage(variant.image),
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
  // Build a lookup from optionValues for swatch data
  const swatchLookup = new Map<string, OptionValueSwatch | undefined>();
  if (option.optionValues) {
    for (const ov of option.optionValues) {
      swatchLookup.set(ov.name, transformSwatch(ov.swatch));
    }
  }

  return {
    id: option.id,
    name: option.name,
    values: option.values.map(
      (value): OptionValue => ({
        id: value,
        name: value,
        swatch: swatchLookup.get(value),
      }),
    ),
  };
}

// Map metafield keys to display labels
const METAFIELD_LABELS: Record<string, string> = {
  material: "Material",
  dimensions: "Dimensions",
  weight: "Weight",
  connectivity: "Connectivity",
  battery_life: "Battery Life",
  warranty: "Warranty",
  country_of_origin: "Country of Origin",
  model_number: "Model Number",
};

function transformMetafields(
  metafields?: (ShopifyMetafield | null)[],
): Array<{ key: string; label: string; value: string }> {
  if (!metafields) return [];

  return metafields
    .filter((mf): mf is ShopifyMetafield => mf !== null && mf.value !== "")
    .map((mf) => ({
      key: mf.key,
      label: METAFIELD_LABELS[mf.key] || formatKey(mf.key),
      value: mf.value,
    }));
}

// Convert snake_case or kebab-case to Title Case
function formatKey(key: string): string {
  return key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function transformShopifyProductCard(product: ShopifyProductCard): ProductCard {
  const defaultVariant = product.selectedOrFirstAvailableVariant;
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: transformImage(product.featuredImage),
    price: product.priceRange.minVariantPrice,
    compareAtPrice: product.compareAtPriceRange?.minVariantPrice ?? undefined,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
    defaultVariantId: defaultVariant?.id,
    defaultVariantNumericId: defaultVariant ? (getNumericShopifyId(defaultVariant.id) ?? undefined) : undefined,
    defaultVariantSelectedOptions: defaultVariant?.selectedOptions ?? [],
  };
}

export function transformShopifyProductDetails(product: ShopifyProduct): ProductDetails {
  const variants = flattenEdges(product.variants).map(transformVariant);
  const defaultVariant = variants.find((v) => v.availableForSale);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: transformImage(product.featuredImage),
    price: product.priceRange.minVariantPrice,
    compareAtPrice: product.compareAtPriceRange?.minVariantPrice ?? undefined,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
    defaultVariantId: defaultVariant?.id,
    defaultVariantNumericId: defaultVariant ? (getNumericShopifyId(defaultVariant.id) ?? undefined) : undefined,
    defaultVariantSelectedOptions: defaultVariant?.selectedOptions ?? [],
    description: product.description,
    descriptionHtml: product.descriptionHtml,
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
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
    manufacturerName: product.vendor,
    categoryId: product.category?.id,
    collectionHandles: flattenEdges(product.collections ?? { edges: [] }).map((c) => c.handle),
    metafields: transformMetafields(product.metafields),
  };
}

export function transformShopifyProductCards(products: ShopifyProductCard[]): ProductCard[] {
  return products.map(transformShopifyProductCard);
}
