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

function cacheTagsFor(type: ShopifySitemapType): string[] {
  // Collection sitemap lists the full set, so it also carries "collections-index" —
  // busted on collections/create and collections/delete alongside the listing page.
  return type === "PRODUCT" ? ["products"] : ["collections", "collections-index"];
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  "use cache: remote";
  cacheLife("max");
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
  cacheLife("max");
  cacheTag(...cacheTagsFor(type));

  const response = await storefront.request<{
    sitemap: { resources: { hasNextPage: boolean; items: SitemapResource[] } };
  }>(GET_SITEMAP_PAGE_QUERY, {
    variables: { type, page },
  });
  assertStorefrontOk(response, "getSitemapPage");

  return response.data.sitemap.resources;
}
