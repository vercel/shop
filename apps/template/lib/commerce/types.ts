import type { Locale } from "@/lib/i18n";
import type {
  Cart,
  Collection,
  Filter,
  MarketingPage,
  MegamenuData,
  NavigationMenu,
  PageInfo,
  PredictiveSearchResult,
  PriceRange,
  ProductDetails,
  ProductFilterInput,
} from "@/lib/types";

export interface ProductOperations {
  getProduct(handle: string, locale?: string): Promise<ProductDetails>;
  getProducts(params: {
    query?: string;
    collection?: string;
    sortKey?: string;
    limit?: number;
    cursor?: string;
    filters?: ProductFilterInput[];
    locale?: string;
  }): Promise<{
    products: ProductDetails[];
    total: number;
    pageInfo: PageInfo;
    filters: Filter[];
    priceRange?: PriceRange;
  }>;
  getCollectionProducts(params: {
    collection: string;
    limit?: number;
    sortKey?: string;
    cursor?: string;
    filters?: ProductFilterInput[];
    locale?: string;
  }): Promise<{
    products: ProductDetails[];
    pageInfo: PageInfo;
    filters: Filter[];
    priceRange?: PriceRange;
  }>;
  getProductRecommendations(handle: string, locale?: string): Promise<ProductDetails[]>;
  getProductById(id: string, locale?: string): Promise<ProductDetails>;
  getProductsByIds(ids: string[], locale?: string): Promise<ProductDetails[]>;
  getProductsByHandles(handles: string[], locale?: string): Promise<ProductDetails[]>;
  buildProductFiltersFromParams(
    searchParams: Record<string, string | string[] | undefined>,
  ): ProductFilterInput[];
}

export type CartShippingOption = {
  title: string;
  estimatedCost: { amount: string; currencyCode: string };
  deliveryMethodType: string;
};

export interface CartOperations {
  getCart(cartId?: string): Promise<Cart | undefined>;
  createCart(locale?: string): Promise<Cart>;
  createCartWithoutCookie(locale?: string): Promise<Cart>;
  addToCart(
    lines: { merchandiseId: string; quantity: number }[],
    cartId?: string,
    locale?: string,
  ): Promise<Cart>;
  updateCart(
    lines: { id: string; merchandiseId: string; quantity: number }[],
    cartIdOverride?: string,
  ): Promise<Cart>;
  removeFromCart(lineIds: string[], cartIdOverride?: string): Promise<Cart>;
  updateCartBuyerIdentity(locale: string, countryCode?: string): Promise<Cart | undefined>;
  linkCartToCustomer(
    customerAccessToken: string,
    cartIdOverride?: string,
  ): Promise<Cart | undefined>;
  updateCartNote(note: string, cartIdOverride?: string): Promise<Cart | undefined>;
  getCartSelectableAddressId(): Promise<string | undefined>;
  addCartDeliveryAddress(address: {
    city?: string;
    countryCode: string;
    zip?: string;
    customerAddressId?: string;
  }): Promise<Cart | undefined>;
  getCartDeliveryOptions(): Promise<CartShippingOption[]>;
  updateCartDeliveryAddress(
    addressId: string,
    address: {
      city?: string;
      countryCode: string;
      zip?: string;
      customerAddressId?: string;
    },
  ): Promise<Cart | undefined>;
}

export interface CollectionOperations {
  getCollections(locale?: string): Promise<Collection[]>;
  getCollection(handle: string, locale?: string): Promise<Collection | undefined>;
}

export interface SearchOperations {
  predictiveSearch(
    query: string,
    locale?: string,
    limit?: number,
  ): Promise<PredictiveSearchResult>;
}

export interface MenuOperations {
  getMenu(handle: string, locale?: string): Promise<NavigationMenu | null>;
  getMegamenuData(locale?: string): Promise<MegamenuData>;
}

export interface CmsOperations {
  getLocalMarketingPage(slug: string, locale: Locale): Promise<MarketingPage | null>;
  getAllLocalMarketingPageSlugs(): Array<{ slug: string; locale: Locale }>;
}

export interface SitemapOperations {
  getAllProductHandles(): Promise<Array<{ handle: string; updatedAt: string }>>;
}

export interface CommerceProvider {
  products: ProductOperations;
  cart: CartOperations;
  collections: CollectionOperations;
  search: SearchOperations;
  menu: MenuOperations;
  cms: CmsOperations;
  sitemap: SitemapOperations;
}
