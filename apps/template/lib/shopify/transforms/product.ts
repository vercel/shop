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
import { flattenEdges } from "@/lib/shopify/utils";
import type {
  Category,
  Image,
  OptionValue,
  OptionValueSwatch,
  ProductCard,
  ProductDetails,
  ProductOption,
  ProductVariant,
  ProductVariantComponent,
  ProductVariantReference,
  Video,
} from "@/lib/types";

type ShopifyBundleComponentVariant = ResultOf<typeof BUNDLE_COMPONENT_VARIANT_FRAGMENT>;
export type ShopifyImage = NonNullable<ShopifyBundleComponentVariant["image"]>;
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

export function transformImage(image: ShopifyImage | null | undefined): Image | null {
  if (!image) return null;
  return {
    url: image.url,
    altText: image.altText ?? "",
    width: image.width ?? 0,
    height: image.height ?? 0,
  };
}

function extractMediaFromProduct(product: ShopifyProduct): {
  images: Image[];
  videos: Video[];
} {
  const images: Image[] = [];
  const videos: Video[] = [];

  for (const node of flattenEdges<ShopifyMediaNode>(product.media)) {
    if (node.__typename === "MediaImage") {
      const img = transformImage(node.image);
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
  const imageLookup = new Map<string, string | undefined>();
  for (const ov of option.optionValues) {
    swatchLookup.set(ov.name, transformSwatch(ov.swatch));
    imageLookup.set(ov.name, ov.firstSelectableVariant?.image?.url);
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
      option.optionValues.some((value) => value.swatch?.color || value.swatch?.image),
  );
  const matchedVariant = colorOption?.optionValues.find(
    (value) => value.name.toLowerCase() === selectedOptionValue?.toLowerCase(),
  )?.firstSelectableVariant;
  const cardVariant = matchedVariant ?? defaultVariant;

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: transformImage(matchedVariant?.image ?? product.featuredImage),
    price: product.priceRange.minVariantPrice,
    maxPrice: product.priceRange.maxVariantPrice,
    compareAtPrice: product.compareAtPriceRange.minVariantPrice,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
    isGiftCard: product.isGiftCard,
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
    compareAtPrice: product.compareAtPriceRange.minVariantPrice,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
    isGiftCard: product.isGiftCard,
    allVariantsInStock:
      !product.encodedVariantExistence ||
      product.encodedVariantExistence === product.encodedVariantAvailability,
    hasUniformPricing: hasUniformPriceRange(product),
    variantsCount: product.variantsCount?.count ?? variants?.length ?? 0,
    defaultVariant,
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
    manufacturerName: product.vendor,
    categoryId: product.category?.id,
    collectionHandles: flattenEdges(product.collections).map((c) => c.handle),
  };
}

export function transformShopifyProductCards(products: ShopifyProductCard[]): ProductCard[] {
  return products.map(transformShopifyProductCard);
}
