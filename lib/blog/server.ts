import { cacheLife, cacheTag } from "next/cache";

import type { Blog, BlogArticle } from "@/lib/blog/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommerceLocale } from "@/lib/config/types";
import { fetchBlog, fetchBlogArticle } from "@/lib/shopify/operations/blogs/server";

export async function getBlog(params: {
  handle: string;
  limit?: number;
  locale?: CommerceLocale;
}): Promise<Blog | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(CACHE_TAGS.articles, CACHE_TAGS.blogs, CACHE_TAGS.blog(params.handle));

  return fetchBlog(params);
}

export async function getBlogArticle(params: {
  articleHandle: string;
  blogHandle: string;
  locale?: CommerceLocale;
}): Promise<BlogArticle | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(
    CACHE_TAGS.articles,
    CACHE_TAGS.blogs,
    CACHE_TAGS.article(params.blogHandle, params.articleHandle),
    CACHE_TAGS.blog(params.blogHandle),
  );

  return fetchBlogArticle(params);
}
