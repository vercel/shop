import type { StaticImageData } from "next/image";

import type { Locale } from "@/lib/i18n";

export type SearchParamsPromise = Promise<Record<string, string | string[] | undefined>>;

export type NormalizedSearchParams = Record<string, string | undefined>;

export function normalizeSearchParams(
  params: Record<string, string | string[] | undefined>,
): NormalizedSearchParams {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

// These types are the contract between data sources and components. Each
// integration (Shopify, Algolia, etc.) transforms its API responses into these.

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface Image {
  altText: string;
  height: number;
  url: string;
  width: number;
}

export interface Video {
  height: number;
  previewImage: Image | null;
  url: string;
  width: number;
}

export interface SEO {
  description: string;
  title: string;
}

export interface ProductCard {
  availableForSale: boolean;
  compareAtPrice?: Money;
  defaultVariantId?: string;
  defaultVariantNumericId?: string;
  defaultVariantSelectedOptions?: SelectedOption[];
  featuredImage: Image | null;
  handle: string;
  id: string;
  price: Money;
  title: string;
  vendor?: string;
}

export interface ProductDetails extends ProductCard {
  category?: Category | null;
  categoryId?: string;
  collectionHandles: string[];
  currencyCode: string;
  description: string;
  descriptionHtml: string;
  images: Image[];
  manufacturerName: string;
  metafields?: Metafield[];
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  seo: SEO;
  tags: string[];
  updatedAt: string;
  variants: ProductVariant[];
  videos: Video[];
}

export interface ProductVariant {
  availableForSale: boolean;
  compareAtPrice?: Money;
  id: string;
  image: Image | null;
  price: Money;
  selectedOptions: SelectedOption[];
  title: string;
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
  ancestors: Category[];
  id: string;
  name: string;
}

export interface Cart {
  appliedGiftCards: AppliedGiftCard[];
  checkoutUrl: string;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  discountAllocations: DiscountAllocation[];
  discountCodes: DiscountCode[];
  id: string | undefined;
  lines: CartLine[];
  note: string | null;
  shippingCost: Money | null;
  totalQuantity: number;
}

export interface CartLine {
  cost: {
    totalAmount: Money;
  };
  discountAllocations: DiscountAllocation[];
  id: string | undefined;
  merchandise: CartMerchandise;
  quantity: number;
}

export interface DiscountCode {
  applicable: boolean;
  code: string;
}

export type DiscountAllocation =
  | { kind: "code"; code: string; discountedAmount: Money }
  | { kind: "automatic" | "custom"; title: string; discountedAmount: Money };

export interface AppliedGiftCard {
  amountUsed: Money;
  balance: Money;
  id: string;
  lastCharacters: string;
}

export interface CartWarning {
  code: string;
  message: string;
  target: string;
}

export interface CartMerchandise {
  id: string;
  image?: Image;
  price?: Money;
  product: CartProduct;
  selectedOptions: SelectedOption[];
  title: string;
}

export interface CartProduct {
  featuredImage: Image;
  handle: string;
  id: string;
  title: string;
}

export interface Collection {
  description: string;
  handle: string;
  image?: Image | null;
  path: string;
  seo: SEO;
  title: string;
  updatedAt: string;
}

export type FilterType = "boolean" | "list" | "price";

export interface FilterValue {
  count: number;
  id: string;
  label: string;
  value: string;
}

export interface Filter {
  id: string;
  label: string;
  paramKey: string;
  type: FilterType;
  values: FilterValue[];
}

export interface PriceRange {
  max: number;
  min: number;
}

export interface CategoryNavItem {
  count: number;
  href: string;
  id: string;
  label: string;
  slug: string;
}

export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
}

export interface ProductListResult {
  filters?: Filter[];
  pageInfo: PageInfo;
  priceRange?: PriceRange;
  products: ProductCard[];
  subcategories?: CategoryNavItem[];
  totalCount: number;
}

export interface PredictiveSearchProduct {
  availableForSale: boolean;
  compareAtPrice?: Money;
  featuredImage: Image | null;
  handle: string;
  id: string;
  price: Money;
  title: string;
  vendor?: string;
}

export interface SearchSuggestion {
  styledText: string;
  text: string;
}

export interface PredictiveSearchCollection {
  handle: string;
  title: string;
}

export interface PredictiveSearchResult {
  collections: PredictiveSearchCollection[];
  products: PredictiveSearchProduct[];
  queries: SearchSuggestion[];
}

export interface MarketingImage {
  alt: string;
  height?: number;
  url: string;
  width?: number;
}

export interface MarketingVideo {
  previewImage?: MarketingImage | null;
  url: string;
}

export interface BannerSection {
  backgroundImage?: MarketingImage | StaticImageData | null;
  backgroundVideo?: MarketingVideo | null;
  ctaLink: string | null;
  ctaText: string | null;
  headline: string;
  id: string;
  subheadline: string | null;
}
