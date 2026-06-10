import { flattenEdges, type ShopifyEdges } from "@/lib/shopify/utils";
import type {
  Category,
  Image,
  OptionValue,
  OptionValueSwatch,
  ProductCard,
  ProductDetails,
  ProductOption,
  ProductSelectionData,
  ProductVariant,
  ProductVariantComponent,
  ProductVariantReference,
  SelectedOption,
  Video,
} from "@/lib/types";

import { allEncodedVariantsAvailable, encodedVariantSet } from "../variant-encoding";

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

interface ShopifyVariantProduct {
  handle: string;
}

interface ShopifyBundleComponentProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage: ShopifyImage | null;
}

interface ShopifyBundleComponentVariant {
  id: string;
  title: string;
  image: ShopifyImage | null;
  product: ShopifyBundleComponentProduct;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: SelectedOption[];
  image: ShopifyImage | null;
  product: ShopifyVariantProduct;
  requiresComponents?: boolean;
  groupedBy?: {
    nodes: ShopifyBundleComponentVariant[];
  };
  components?: {
    nodes: Array<{
      quantity: number;
      productVariant: ShopifyBundleComponentVariant;
    }>;
  };
}

interface ShopifyOptionValueSwatch {
  color: string | null;
  image: { previewImage: { url: string } } | null;
}

export interface ShopifyOptionValue {
  id: string;
  name: string;
  swatch: ShopifyOptionValueSwatch | null;
  firstSelectableVariant: ShopifyVariant | null;
}

export interface ShopifyOption {
  id: string;
  name: string;
  optionValues: ShopifyOptionValue[];
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

export interface ShopifyProductSelection {
  handle: string;
  encodedVariantAvailability: string;
  encodedVariantExistence: string;
  options: ShopifyOption[];
  selectedOrFirstAvailableVariant: ShopifyVariant | null;
  adjacentVariants: ShopifyVariant[];
}

export interface ShopifyProduct extends ShopifyProductSelection {
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
  variantsCount: {
    count: number;
  };
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
    image?: { url: string } | null;
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

function transformVariantReference(
  variant: ShopifyBundleComponentVariant,
): ProductVariantReference {
  return {
    id: variant.id,
    title: variant.title,
    image: transformImage(variant.image),
    product: {
      id: variant.product.id,
      handle: variant.product.handle,
      title: variant.product.title,
      featuredImage: transformImage(variant.product.featuredImage),
    },
  };
}

function transformBundleComponent(
  component: NonNullable<ShopifyVariant["components"]>["nodes"][number],
): ProductVariantComponent {
  return {
    quantity: component.quantity,
    variant: transformVariantReference(component.productVariant),
  };
}

function transformVariant(variant: ShopifyVariant): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    productHandle: variant.product.handle,
    availableForSale: variant.availableForSale,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    selectedOptions: variant.selectedOptions,
    image: transformImage(variant.image),
    requiresComponents: variant.requiresComponents ?? false,
    bundleParents: variant.groupedBy?.nodes.map(transformVariantReference) ?? [],
    components: variant.components?.nodes.map(transformBundleComponent) ?? [],
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

type ProductOptionMappings = Record<string, Record<string, number>>;

function selectedOptionsToRecord(options: SelectedOption[]): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.name, option.value]));
}

function selectedOptionsKey(options: SelectedOption[] | Record<string, string>): string {
  return JSON.stringify(Array.isArray(options) ? selectedOptionsToRecord(options) : options);
}

function mapProductOptions(options: ShopifyOption[]): ProductOptionMappings {
  return Object.fromEntries(
    options.map((option) => [
      option.name,
      Object.fromEntries(option.optionValues.map((value, index) => [value.name, index])),
    ]),
  );
}

function buildEncodingKey(
  selectedOptions: Record<string, string>,
  mappings: ProductOptionMappings,
): number[] {
  return Object.keys(selectedOptions)
    .map((name) => mappings[name]?.[selectedOptions[name]])
    .filter((index): index is number => index !== undefined);
}

function getSelectionVariants(product: ShopifyProductSelection): ShopifyVariant[] {
  const variants = new Map<string, ShopifyVariant>();

  for (const option of product.options) {
    for (const value of option.optionValues) {
      if (value.firstSelectableVariant) {
        variants.set(value.firstSelectableVariant.id, value.firstSelectableVariant);
      }
    }
  }

  for (const variant of product.adjacentVariants) {
    variants.set(variant.id, variant);
  }

  if (product.selectedOrFirstAvailableVariant) {
    variants.set(
      product.selectedOrFirstAvailableVariant.id,
      product.selectedOrFirstAvailableVariant,
    );
  }

  return [...variants.values()];
}

function transformOptions(product: ShopifyProductSelection): ProductOption[] {
  const selectedVariant = product.selectedOrFirstAvailableVariant;
  const selectedOptions = selectedOptionsToRecord(selectedVariant?.selectedOptions ?? []);
  const selectedOptionNames = new Set(
    selectedVariant?.selectedOptions.map((option) => option.name),
  );
  const mappings = mapProductOptions(product.options);
  const availability = encodedVariantSet(product.encodedVariantAvailability);
  const existence = encodedVariantSet(product.encodedVariantExistence);
  const variantsBySelection = new Map(
    [selectedVariant, ...product.adjacentVariants]
      .filter((variant): variant is ShopifyVariant => variant !== null)
      .map((variant) => [selectedOptionsKey(variant.selectedOptions), variant]),
  );

  return product.options
    .filter((option) => selectedOptionNames.has(option.name))
    .map((option, optionIndex): ProductOption => {
      const values = option.optionValues.map((value): OptionValue => {
        const targetOptions = { ...selectedOptions, [option.name]: value.name };
        const encodingKey = buildEncodingKey(targetOptions, mappings).slice(0, optionIndex + 1);
        const variant =
          variantsBySelection.get(selectedOptionsKey(targetOptions)) ??
          value.firstSelectableVariant;
        const query = new URLSearchParams(
          variant ? selectedOptionsToRecord(variant.selectedOptions) : targetOptions,
        ).toString();

        return {
          id: value.id,
          name: value.name,
          available: availability.has(encodingKey.join(",")),
          exists: existence.has(encodingKey.join(",")),
          href: `/products/${variant?.product.handle ?? product.handle}${query ? `?${query}` : ""}`,
          image: variant?.image?.url,
          selected: selectedOptions[option.name] === value.name,
          swatch: transformSwatch(value.swatch),
        };
      });

      return {
        id: option.id,
        name: option.name,
        values,
      };
    });
}

export function transformShopifyProductSelection(
  product: ShopifyProductSelection,
): ProductSelectionData {
  return {
    options: transformOptions(product),
    selectedVariant: product.selectedOrFirstAvailableVariant
      ? transformVariant(product.selectedOrFirstAvailableVariant)
      : undefined,
    variants: getSelectionVariants(product).map(transformVariant),
  };
}

function transformOption(option: ShopifyOption): ProductOption {
  const values = option.optionValues.map(
    (value): OptionValue => ({
      id: value.id,
      name: value.name,
      available: true,
      exists: true,
      href: "",
      selected: false,
      swatch: transformSwatch(value.swatch),
    }),
  );

  return {
    id: option.id,
    name: option.name,
    values,
  };
}

function transformFallbackOptions(options: ShopifyOption[]): ProductOption[] {
  return options.map(transformOption);
}

function transformProductSelectionOrFallback(
  product: ShopifyProductSelection,
): ProductSelectionData {
  if (!product.selectedOrFirstAvailableVariant) {
    return {
      options: transformFallbackOptions(product.options),
      selectedVariant: undefined,
      variants: [],
    };
  }

  return transformShopifyProductSelection(product);
}

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
  };
}

function hasUniformPriceRange(product: ShopifyProduct): boolean {
  const { compareAtPriceRange, priceRange } = product;
  if (priceRange.minVariantPrice.amount !== priceRange.maxVariantPrice.amount) return false;
  if (!compareAtPriceRange) return true;
  return compareAtPriceRange.minVariantPrice.amount === compareAtPriceRange.maxVariantPrice.amount;
}

export function transformShopifyProductDetails(product: ShopifyProduct): ProductDetails {
  const selection = transformProductSelectionOrFallback(product);
  const defaultVariant = selection.selectedVariant;
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
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    ...extractMediaFromProduct(product),
    variants: selection.variants,
    variantsCount: product.variantsCount.count,
    allVariantsInStock: allEncodedVariantsAvailable(
      product.encodedVariantExistence,
      product.encodedVariantAvailability,
    ),
    hasUniformPricing: hasUniformPriceRange(product),
    options: selection.options,
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
