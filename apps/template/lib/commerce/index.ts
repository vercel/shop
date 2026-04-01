import { shopifyProvider } from "./providers/shopify";

export const commerce = shopifyProvider;

export type { CommerceProvider } from "./types";
export type {
  CartShippingOption,
  CartOperations,
  CollectionOperations,
  CmsOperations,
  MenuOperations,
  ProductOperations,
  SearchOperations,
  SitemapOperations,
  ProductFilter,
  ShopifyFilter,
  Menu,
  MenuItem,
  MenuItemType,
  MegamenuData,
  MegamenuItem,
  MegamenuPanel,
  MegamenuCategory,
} from "./types";
