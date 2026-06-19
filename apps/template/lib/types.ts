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
  /** True when every existing variant is in stock (existence trie == availability trie). */
  allVariantsInStock: boolean;
  category?: Category | null;
  categoryId?: string;
  collectionHandles: string[];
  compareAtPriceRange?: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  currencyCode: string;
  /** Selected-or-first-available variant; powers the eager/no-params render. */
  defaultVariant?: ProductVariant;
  description: string;
  descriptionHtml: string;
  /** Trie of option-value combinations with an available variant (Storefront 2024-10+). */
  encodedVariantAvailability?: string;
  /** Trie of option-value combinations that exist (Storefront 2024-10+). */
  encodedVariantExistence?: string;
  /** True when min/max price (and compare-at) bounds match, so price renders without a variant. */
  hasUniformPricing: boolean;
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
  /** Only populated by getProductWithVariants (agent + markdown); the PDP omits it. */
  variants?: ProductVariant[];
  /** Exact variant count from Shopify; authoritative single-variant signal (=== 1). */
  variantsCount: number;
  videos: Video[];
}

export interface ProductVariant {
  availableForSale: boolean;
  /** Bundle variants this variant is a component of (Shopify `groupedBy`); empty for non-components. */
  bundleParents: ProductVariantReference[];
  compareAtPrice?: Money;
  /** Fixed-bundle contents (Shopify `components`); empty unless this is a bundle variant. */
  components: ProductVariantComponent[];
  id: string;
  image: Image | null;
  price: Money;
  /** True when the variant cannot be purchased without components (bundle parent). */
  requiresComponents: boolean;
  selectedOptions: SelectedOption[];
  title: string;
}

/** A bundle component: a referenced variant and how many of it the bundle includes. */
export interface ProductVariantComponent {
  quantity: number;
  variant: ProductVariantReference;
}

/** Lightweight variant pointer used by bundle relationships (no price/availability). */
export interface ProductVariantReference {
  id: string;
  image: Image | null;
  product: {
    featuredImage: Image | null;
    handle: string;
    id: string;
    title: string;
  };
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
  /** Representative variant image for this value (first selectable variant). */
  image?: string;
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
  /** Shopify edit instruction — false for a fixed bundle's component lines. */
  canRemove: boolean;
  /** Shopify edit instruction — false for a fixed bundle's component lines. */
  canUpdateQuantity: boolean;
  /** Nested bundle component lines; empty for ordinary lines. */
  components: CartLine[];
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

// Customer account — populated from the Shopify Customer Account API (a separate
// schema from the Storefront API). Status fields hold raw Shopify enum values
// (e.g. "FULFILLED", "PAID"); humanize them at the display layer.

export interface CustomerProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface OrderLineItem {
  image: Image | null;
  quantity: number;
  title: string;
  totalPrice: Money | null;
  variantTitle: string | null;
}

export interface CustomerOrderSummary {
  financialStatus: string | null;
  fulfillmentStatus: string;
  id: string;
  name: string;
  number: number;
  processedAt: string;
  totalPrice: Money;
}

export interface CustomerOrder extends CustomerOrderSummary {
  lineItems: OrderLineItem[];
  shippingAddress: CustomerAddress | null;
  statusPageUrl: string;
  subtotal: Money | null;
  totalShipping: Money | null;
  totalTax: Money | null;
}

export interface CustomerOrdersPage {
  orders: CustomerOrderSummary[];
  pageInfo: PageInfo;
}

export interface CustomerAddress {
  address1: string | null;
  address2: string | null;
  city: string | null;
  company: string | null;
  firstName: string | null;
  formatted: string[];
  id: string;
  isDefault: boolean;
  lastName: string | null;
  phoneNumber: string | null;
  territoryCode: string | null;
  zip: string | null;
  zoneCode: string | null;
}

export interface CustomerAddressInput {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  territoryCode?: string;
  zip?: string;
  zoneCode?: string;
}
