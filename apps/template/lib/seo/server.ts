import { cacheLife, cacheTag } from "next/cache";

import { fetchSitemapPage, fetchSitemapPagesCount } from "@/lib/shopify/operations/sitemap/server";
import type { ShopifySitemapType, SitemapResource } from "@/lib/shopify/operations/sitemap/types";

function sitemapCacheTags(type: ShopifySitemapType): string[] {
  if (type === "ARTICLE") return ["articles", "articles-index"];
  if (type === "BLOG") return ["blogs", "blogs-index"];
  if (type === "COLLECTION") return ["collections", "collections-index"];
  return type === "PAGE" ? ["pages"] : ["products", "products-index"];
}

function tagSitemapResources(type: ShopifySitemapType, resources: SitemapResource[]): void {
  if (type === "PAGE") return;

  if (type === "ARTICLE") {
    for (const resource of resources) {
      cacheTag(`article-${resource.blogHandle}-${resource.handle}`);
    }
    return;
  }

  const prefix = type === "BLOG" ? "blog" : type === "COLLECTION" ? "collection" : "product";
  for (const resource of resources) {
    cacheTag(`${prefix}-${resource.handle}`);
  }
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...sitemapCacheTags(type));

  return fetchSitemapPagesCount(type);
}

export async function getShopifySitemapPage(
  type: ShopifySitemapType,
  page: number,
): Promise<{ hasNextPage: boolean; items: SitemapResource[] }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...sitemapCacheTags(type));

  const result = await fetchSitemapPage(type, page);
  tagSitemapResources(type, result.items);
  return result;
}
