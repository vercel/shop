import type {
  PredictiveSearchCollection,
  PredictiveSearchProduct,
  PredictiveSearchResult,
  SearchSuggestion,
} from "@/lib/types";

interface ShopifyPredictiveImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface ShopifyPredictiveMoney {
  amount: string;
  currencyCode: string;
}

interface ShopifyPredictiveProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: ShopifyPredictiveImage | null;
  priceRange: {
    minVariantPrice: ShopifyPredictiveMoney;
  };
  compareAtPriceRange: {
    minVariantPrice: ShopifyPredictiveMoney;
  } | null;
}

interface ShopifyPredictiveCollection {
  handle: string;
  title: string;
}

interface ShopifySearchQuerySuggestion {
  text: string;
  styledText: string;
}

export interface ShopifyPredictiveSearchResult {
  products: ShopifyPredictiveProduct[];
  collections: ShopifyPredictiveCollection[];
  queries: ShopifySearchQuerySuggestion[];
}

export function transformPredictiveSearchResult(
  data: ShopifyPredictiveSearchResult,
): PredictiveSearchResult {
  return {
    products: data.products.map(transformPredictiveProduct),
    collections: data.collections.map(transformPredictiveCollection),
    queries: data.queries.map(transformSearchSuggestion),
  };
}

function transformPredictiveProduct(product: ShopifyPredictiveProduct): PredictiveSearchProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: product.featuredImage
      ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText ?? "",
          width: product.featuredImage.width,
          height: product.featuredImage.height,
        }
      : null,
    price: product.priceRange.minVariantPrice,
    compareAtPrice: product.compareAtPriceRange?.minVariantPrice ?? undefined,
    vendor: product.vendor || undefined,
    availableForSale: product.availableForSale,
  };
}

function transformPredictiveCollection(
  collection: ShopifyPredictiveCollection,
): PredictiveSearchCollection {
  return {
    handle: collection.handle,
    title: collection.title,
  };
}

function transformSearchSuggestion(suggestion: ShopifySearchQuerySuggestion): SearchSuggestion {
  return {
    text: suggestion.text,
    styledText: suggestion.styledText,
  };
}
