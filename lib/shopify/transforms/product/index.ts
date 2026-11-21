import { flattenConnection } from "@shopify/hydrogen";

import type { Image, Video } from "@/lib/media/types";
import type {
  Category,
  OptionValue,
  OptionValueSwatch,
  ProductCard,
  ProductDetails,
  ProductOption,
  ProductVariant,
  ProductVariantComponent,
  ProductVariantReference,
} from "@/lib/product/types";
import type {
  ShopifyBundleComponentVariant,
  ShopifyCategory,
  ShopifyImage,
  ShopifyMediaNode,
  ShopifyOption,
  ShopifyOptionValueSwatch,
  ShopifyProduct,
  ShopifyProductCard,
  ShopifyVariant,
} from "@/lib/shopify/transforms/product/types";

export function transformImage(image: ShopifyImage | null | undefined): Image | null {
  if (!image) return null;
  return {
    altText: image.altText ?? "",
    height: image.height ?? 0,
    url: image.url,
    width: image.width ?? 0,
  };
}

function extractMediaFromProduct(product: ShopifyProduct): {
  images: Image[];
  videos: Video[];
} {
  const images: Image[] = [];
  const videos: Video[] = [];

  for (const node of flattenConnection<ShopifyMediaNode>(product.media)) {
    if (node.__typename === "MediaImage") {
      const img = transformImage(node.image);
      if (img) images.push(img);
    } else if (node.__typename === "Video") {
      const mp4Sources = node.sources.filter((s) => s.mimeType.startsWith("video/mp4"));
      const bestSource = mp4Sources.sort((a, b) => b.width - a.width)[0] ?? node.sources[0];
      if (bestSource) {
        videos.push({
          height: bestSource.height,
          previewImage: transformImage(node.previewImage),
          url: bestSource.url,
          width: bestSource.width,
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
    ancestors: cappedAncestors.map((a) => ({
      ancestors: [],
      id: a.id,
      name: a.name,
    })),
    id: category.id,
    name: category.name,
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
    availableForSale: variant.availableForSale,
    bundleParents: variant.groupedBy?.nodes.map(transformVariantReference) ?? [],
    compareAtPrice: variant.compareAtPrice ?? undefined,
    components: variant.components?.nodes.map(transformBundleComponent) ?? [],
    id: variant.id,
    image: transformImage(variant.image),
    price: variant.price,
    productHandle: variant.product.handle,
    productTitle: variant.product.title,
    requiresComponents: variant.requiresComponents ?? false,
    requiresSellingPlan: variant.product.requiresSellingPlan,
    selectedOptions: variant.selectedOptions,
    sellingPlanAllocations: variant.sellingPlanAllocations.nodes.map((allocation) => {
      const adjustment = allocation.priceAdjustments[0];
      return {
        compareAtPrice: adjustment?.compareAtPrice ?? variant.compareAtPrice ?? variant.price,
        price: adjustment?.price ?? variant.price,
        sellingPlan: allocation.sellingPlan,
      };
    }),
    title: variant.title,
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
  return {
    id: option.id,
    name: option.name,
    values: option.optionValues.map((value): OptionValue => {
      const firstSelectableVariant = value.firstSelectableVariant
        ? transformVariant(value.firstSelectableVariant)
        : undefined;
      return {
        firstSelectableVariant,
        id: value.name,
        image: firstSelectableVariant?.image?.url,
        name: value.name,
        swatch: transformSwatch(value.swatch),
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

  return {
    availableForSale: product.availableForSale,
    compareAtPrice: product.compareAtPriceRange.minVariantPrice,
    defaultVariantSelectedOptions: cardVariant?.selectedOptions ?? [],
    featuredImage: transformImage(matchedVariant?.image ?? product.featuredImage),
    handle: product.handle,
    id: product.id,
    isGiftCard: product.isGiftCard,
    maxPrice: product.priceRange.maxVariantPrice,
    price: product.priceRange.minVariantPrice,
    title: product.title,
    vendor: product.vendor || undefined,
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
    ? flattenConnection(product.variants).map(transformVariant)
    : undefined;
  const defaultVariant = product.selectedOrFirstAvailableVariant
    ? transformVariant(product.selectedOrFirstAvailableVariant)
    : (variants?.find((v) => v.availableForSale) ?? variants?.[0]);
  return {
    adjacentVariants: product.adjacentVariants.map(transformVariant),
    allVariantsInStock:
      !product.encodedVariantExistence ||
      product.encodedVariantExistence === product.encodedVariantAvailability,
    availableForSale: product.availableForSale,
    compareAtPrice: product.compareAtPriceRange.minVariantPrice,
    defaultVariant,
    defaultVariantSelectedOptions: defaultVariant?.selectedOptions ?? [],
    defaultVariantSku: product.selectedOrFirstAvailableVariant?.sku || undefined,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    encodedVariantAvailability: product.encodedVariantAvailability ?? undefined,
    encodedVariantExistence: product.encodedVariantExistence ?? undefined,
    featuredImage: transformImage(product.featuredImage),
    handle: product.handle,
    hasUniformPricing: hasUniformPriceRange(product),
    id: product.id,
    isGiftCard: product.isGiftCard,
    maxPrice: product.priceRange.maxVariantPrice,
    price: product.priceRange.minVariantPrice,
    title: product.title,
    variantsCount: product.variantsCount?.count ?? variants?.length ?? 0,
    vendor: product.vendor || undefined,
    ...extractMediaFromProduct(product),
    category: transformCategory(product.category),
    compareAtPriceRange: product.compareAtPriceRange,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
    options: product.options.map(transformOption),
    priceRange: product.priceRange,
    seo: {
      description: product.seo.description || product.description,
      title: product.seo.title || product.title,
    },
    updatedAt: product.updatedAt,
    variants,
    variantsComplete: Boolean(
      variants?.length && product.variants?.pageInfo?.hasNextPage === false,
    ),
  };
}
