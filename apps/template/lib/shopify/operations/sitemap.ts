import { cacheLife, cacheTag } from "next/cache";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

export type ShopifySitemapType = "COLLECTION" | "PRODUCT";

export interface SitemapResource {
  handle: string;
  updatedAt: string;
}

const GET_SITEMAP_PAGES_COUNT_QUERY = `#graphql
  query getSitemapPagesCount($type: SitemapType!) {
    sitemap(type: $type) {
      pagesCount {
        count
      }
    }
  }
` as const;

const GET_SITEMAP_PAGE_QUERY = `#graphql
  query getSitemapPage($type: SitemapType!, $page: Int!) {
    sitemap(type: $type) {
      resources(page: $page) {
        hasNextPage
        items {
          handle
          updatedAt
        }
      }
    }
  }
` as const;

function cacheTagFor(type: ShopifySitemapType): string {
  return type === "PRODUCT" ? "products" : "collections";
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTagFor(type));

  const response = await storefront.request<{ sitemap: { pagesCount: { count: number } } }>(
    GET_SITEMAP_PAGES_COUNT_QUERY,
    { variables: { type } },
  );
  assertStorefrontOk(response, "getSitemapPagesCount");

  return response.data.sitemap.pagesCount.count;
}

export async function getShopifySitemapPage(
  type: ShopifySitemapType,
  page: number,
): Promise<{ hasNextPage: boolean; items: SitemapResource[] }> {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTagFor(type));

  const response = await storefront.request<{
    sitemap: { resources: { hasNextPage: boolean; items: SitemapResource[] } };
  }>(GET_SITEMAP_PAGE_QUERY, { variables: { type, page } });
  assertStorefrontOk(response, "getSitemapPage");

  return response.data.sitemap.resources;
}
