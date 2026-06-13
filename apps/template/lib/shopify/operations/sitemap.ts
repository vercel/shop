import { cacheLife, cacheTag } from "next/cache";

import { shopifyFetch } from "../fetch";

export type ShopifySitemapType = "COLLECTION" | "PRODUCT";

export interface SitemapResource {
  handle: string;
  updatedAt: string;
}

const GET_SITEMAP_PAGES_COUNT_QUERY = `
  query getSitemapPagesCount($type: SitemapType!) {
    sitemap(type: $type) {
      pagesCount {
        count
      }
    }
  }
`;

const GET_SITEMAP_PAGE_QUERY = `
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
`;

function cacheTagFor(type: ShopifySitemapType): string {
  return type === "PRODUCT" ? "products" : "collections";
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(cacheTagFor(type));

  const data = await shopifyFetch<{ sitemap: { pagesCount: { count: number } } }>({
    operation: "getSitemapPagesCount",
    query: GET_SITEMAP_PAGES_COUNT_QUERY,
    variables: { type },
  });

  return data.sitemap.pagesCount.count;
}

export async function getShopifySitemapPage(
  type: ShopifySitemapType,
  page: number,
): Promise<{ hasNextPage: boolean; items: SitemapResource[] }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(cacheTagFor(type));

  const data = await shopifyFetch<{
    sitemap: { resources: { hasNextPage: boolean; items: SitemapResource[] } };
  }>({
    operation: "getSitemapPage",
    query: GET_SITEMAP_PAGE_QUERY,
    variables: { type, page },
  });

  return data.sitemap.resources;
}
