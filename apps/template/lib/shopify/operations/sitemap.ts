import { cacheLife, cacheTag } from "next/cache";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

export type ShopifySitemapType = "COLLECTION" | "PAGE" | "PRODUCT";

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

function cacheTagsFor(type: ShopifySitemapType): string[] {
  if (type === "COLLECTION") return ["collections", "collections-index"];
  return type === "PAGE" ? ["pages"] : ["products"];
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  "use cache: remote";
  if (type === "PAGE") {
    cacheLife("hours");
  } else {
    cacheLife("max");
  }
  cacheTag(...cacheTagsFor(type));

  const response = await storefront.request<{ sitemap: { pagesCount: { count: number } } }>(
    GET_SITEMAP_PAGES_COUNT_QUERY,
    {
      variables: { type },
    },
  );
  assertStorefrontOk(response, "getSitemapPagesCount");

  return response.data.sitemap.pagesCount.count;
}

export async function getShopifySitemapPage(
  type: ShopifySitemapType,
  page: number,
): Promise<{ hasNextPage: boolean; items: SitemapResource[] }> {
  "use cache: remote";
  if (type === "PAGE") {
    cacheLife("hours");
  } else {
    cacheLife("max");
  }
  cacheTag(...cacheTagsFor(type));

  const response = await storefront.request<{
    sitemap: { resources: { hasNextPage: boolean; items: SitemapResource[] } };
  }>(GET_SITEMAP_PAGE_QUERY, {
    variables: { type, page },
  });
  assertStorefrontOk(response, "getSitemapPage");

  return response.data.sitemap.resources;
}
