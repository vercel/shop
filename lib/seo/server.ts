import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
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
  if (type === "ARTICLE") return [CACHE_TAGS.articles, CACHE_TAGS.articlesIndex];
  if (type === "BLOG") return [CACHE_TAGS.blogs, CACHE_TAGS.blogsIndex];
  if (type === "COLLECTION") return [CACHE_TAGS.collections, CACHE_TAGS.collectionsIndex];
  return type === "PAGE" ? [CACHE_TAGS.pages] : [CACHE_TAGS.products, CACHE_TAGS.productsIndex];
}

function tagSitemapResources(type: ShopifySitemapType, resources: SitemapResource[]): void {
  if (type === "PAGE") return;

  if (type === "ARTICLE") {
    for (const resource of resources) {
      if (resource.blogHandle) cacheTag(CACHE_TAGS.article(resource.blogHandle, resource.handle));
    }
    return;
  }

  const tag =
    type === "BLOG"
      ? CACHE_TAGS.blog
      : type === "COLLECTION"
        ? CACHE_TAGS.collection
        : CACHE_TAGS.product;
  for (const resource of resources) {
    cacheTag(tag(resource.handle));
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
