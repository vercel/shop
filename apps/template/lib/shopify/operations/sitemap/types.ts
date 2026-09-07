import type { SitemapType } from "@shopify/hydrogen/storefront-api-types";

export type ShopifySitemapType = SitemapType;

export interface SitemapResource {
  handle: string;
  pathname?: string;
  updatedAt: string;
}
