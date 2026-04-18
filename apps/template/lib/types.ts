import type { StaticImageData } from "next/image";

import type { Locale } from "@/lib/i18n";

export type SearchParamsPromise = Promise<Record<string, string | string[] | undefined>>;

export type NormalizedSearchParams = Record<string, string | undefined>;

/**
 * Normalize search params by taking the first value of any arrays.
 * Use this to convert raw Next.js searchParams to a clean string map.
 */
export function normalizeSearchParams(
  params: Record<string, string | string[] | undefined>,
): NormalizedSearchParams {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

/**
 * Core types for the commerce template
 *
 * These types define the contract between data sources and components.
 * Each integration (Shopify, Algolia, etc.) transforms their API responses
 * into these types.
 */

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface Image {
  url: string;
  altText: string;
  width: number;
  height: number;
}

export interface Video {
  url: string;
  previewImage: Image | null;
  width: number;
  height: number;
}

export interface SEO {
  title: string;
  description: string;
}

/**
 * Minimal product data for cards in grids/carousels
 * Used by: ProductCard, search results, category listings
 */
export interface ProductCard {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image | null;
  images: Image[];
  price: Money;
  compareAtPrice?: Money;
  vendor?: string;
  availableForSale: boolean;
  defaultVariantId?: string;
  defaultVariantNumericId?: string;
  defaultVariantSelectedOptions?: SelectedOption[];
}

/**
 * Extended product data for product detail pages
 * Used by: PDP components (Info, Images, Variants, Details)
 */
export interface ProductDetails extends ProductCard {
  description: string;
  descriptionHtml: string;
  images: Image[];
  videos: Video[];
  variants: ProductVariant[];
  options: ProductOption[];
  tags: string[];
  seo: SEO;
  category?: Category | null;
  updatedAt: string;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  currencyCode: string;
  manufacturerName: string;
  categoryId?: string;
  collectionHandles: string[];
  metafields?: Metafield[];
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice?: Money;
  selectedOptions: SelectedOption[];
  image: Image | null;
}

export interface ProductOption {
  id: string;
  name: string;
  values: OptionValue[];
}

export interface OptionValueSwatch {
  color?: string;
  image?: string;
}

export interface OptionValue {
  id: string;
  name: string;
  swatch?: OptionValueSwatch;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Metafield {
  key: string;
  label: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  ancestors: Category[];
}

export interface Cart {
  id: string | undefined;
  checkoutUrl: string;
  totalQuantity: number;
  note: string | null;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  lines: CartLine[];
  shippingCost: Money | null;
}

export interface CartLine {
  id: string | undefined;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: CartMerchandise;
}

export interface CartMerchandise {
  id: string;
  title: string;
  image?: Image;
  price?: Money;
  selectedOptions: SelectedOption[];
  product: CartProduct;
}

/**
 * Minimal product data within cart context
 */
export interface CartProduct {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image;
}

export interface Collection {
  handle: string;
  title: string;
  description: string;
  image?: Image | null;
  seo: SEO;
  path: string;
  updatedAt: string;
}

export type FilterType = "list" | "price" | "boolean";

export interface FilterValue {
  id: string;
  label: string;
  value: string;
  count: number;
}

export interface Filter {
  id: string;
  label: string;
  type: FilterType;
  paramKey: string;
  values: FilterValue[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CategoryNavItem {
  id: string;
  label: string;
  slug: string;
  count: number;
  href: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

export interface ProductListResult {
  products: ProductCard[];
  totalCount: number;
  pageInfo: PageInfo;
  filters?: Filter[];
  priceRange?: PriceRange;
  subcategories?: CategoryNavItem[];
}

/**
 * Lightweight product data for predictive search results.
 * Subset of ProductCard for predictive search results.
 */
export interface PredictiveSearchProduct {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image | null;
  price: Money;
  compareAtPrice?: Money;
  vendor?: string;
  availableForSale: boolean;
}

export interface SearchSuggestion {
  text: string;
  styledText: string;
}

export interface PredictiveSearchCollection {
  handle: string;
  title: string;
}

export interface PredictiveSearchResult {
  products: PredictiveSearchProduct[];
  collections: PredictiveSearchCollection[];
  queries: SearchSuggestion[];
}

export interface MarketingImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface BannerSection {
  id: string;
  headline: string;
  subheadline: string | null;
  backgroundImage?: MarketingImage | StaticImageData | null;
  ctaText: string | null;
  ctaLink: string | null;
}
