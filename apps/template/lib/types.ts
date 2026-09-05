import type { I18nConfig } from "@shopify/hydrogen";

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
  defaultVariantSelectedOptions?: SelectedOption[];
  featuredImage: Image | null;
  handle: string;
  id: string;
  isGiftCard: boolean;
  maxPrice: Money;
  price: Money;
  title: string;
  vendor?: string;
}

export interface ProductDetails extends ProductCard {
  /** Sparse variant cache around the default variant; feeds Hydrogen's product form store. */
  adjacentVariants: ProductVariant[];
  allVariantsInStock: boolean;
  category?: Category | null;
  categoryId?: string;
  collectionHandles: string[];
  compareAtPriceRange?: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  currencyCode: string;
  defaultVariant?: ProductVariant;
  description: string;
  descriptionHtml: string;
  encodedVariantAvailability?: string;
  encodedVariantExistence?: string;
  hasUniformPricing: boolean;
  images: Image[];
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
  variantsCount: number;
  videos: Video[];
}

export interface ProductVariant {
  availableForSale: boolean;
  bundleParents: ProductVariantReference[];
  compareAtPrice?: Money;
  components: ProductVariantComponent[];
  id: string;
  image: Image | null;
  price: Money;
  /** Differs from the page's handle for combined-listing option values. */
  productHandle: string;
  productTitle: string;
  requiresComponents: boolean;
  selectedOptions: SelectedOption[];
  title: string;
}

export interface ProductVariantComponent {
  quantity: number;
  variant: ProductVariantReference;
}

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
  firstSelectableVariant?: ProductVariant;
  id: string;
  image?: string;
  name: string;
  swatch?: OptionValueSwatch;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Category {
  ancestors: Category[];
  id: string;
  name: string;
}

export interface Collection {
  description: string;
  handle: string;
  id?: string;
  image?: Image | null;
  path: string;
  seo: SEO;
  title: string;
  updatedAt: string;
}

export interface CollectionWithThumbnail extends Collection {
  thumbnail: Image | null;
}

export interface Blog {
  articles: BlogArticle[];
  handle: string;
  seo: SEO;
  title: string;
}

export interface BlogArticle {
  author?: string;
  blogHandle: string;
  blogTitle: string;
  body?: string;
  excerpt: string;
  handle: string;
  image: Image | null;
  publishedAt: string;
  seo: SEO;
  tags: string[];
  title: string;
}

export interface ContentPage {
  body: string;
  handle: string;
  seo: SEO;
  title: string;
  updatedAt: string;
}

export type FilterPresentation = "image" | "swatch" | "text";

export type FilterType = "boolean" | "list" | "price";

export interface FilterValue {
  count: number;
  id: string;
  input: string;
  label: string;
  swatch?: OptionValueSwatch;
  value: string;
}

export interface Filter {
  id: string;
  label: string;
  paramKey: string;
  presentation?: FilterPresentation;
  type: FilterType;
  values: FilterValue[];
}

export interface PriceRange {
  currencyCode?: string;
  max: number;
  min: number;
}

export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
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

export interface ShopAnalyticsData {
  acceptedLanguage: I18nConfig["language"];
  country: I18nConfig["country"];
  currency: string;
  shopId: string;
  storeDomain: string;
}

export interface ShopPolicy {
  body: string;
  handle: string;
  title: string;
}

interface PredictiveSearchCollection {
  handle: string;
  title: string;
}

export interface PredictiveSearchResult {
  collections: PredictiveSearchCollection[];
  products: PredictiveSearchProduct[];
  queries: SearchSuggestion[];
}

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
