import { cacheLife, cacheTag } from "next/cache";

import {
  fetchArticleSitemapPage,
  fetchSitemapPage,
  fetchSitemapPagesCount,
} from "@/lib/shopify/operations/sitemap/server";
import type {
  ArticleSitemapPage,
  ShopifySitemapType,
  SitemapResource,
} from "@/lib/shopify/operations/sitemap/types";

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

// Each shard starts from the previous shard's cached cursor, so a shard costs one request once earlier shards are cached.
async function getArticleSitemapPage(page: number): Promise<ArticleSitemapPage> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...sitemapCacheTags("ARTICLE"));

  const previous = page > 1 ? await getArticleSitemapPage(page - 1) : null;
  if (page < 1 || (previous && !previous.hasNextPage)) {
    return { endCursor: null, hasNextPage: false, items: [] };
  }
  return fetchArticleSitemapPage(previous?.endCursor ?? null);
}

export async function getShopifySitemapPage(
  type: ShopifySitemapType,
  page: number,
): Promise<{ items: SitemapResource[] }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...sitemapCacheTags(type));

  const result =
    type === "ARTICLE"
      ? { items: (await getArticleSitemapPage(page)).items }
      : await fetchSitemapPage(type, page);
  tagSitemapResources(type, result.items);
  return result;
}
