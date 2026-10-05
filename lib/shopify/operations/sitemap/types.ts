import type { SitemapType } from "@shopify/hydrogen/storefront-api-types";

export type ShopifySitemapType = SitemapType;

export interface SitemapResource {
  blogHandle?: string;
  handle: string;
  pathname?: string;
  updatedAt: string;
}
