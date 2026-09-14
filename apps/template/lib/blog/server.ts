import { cacheLife, cacheTag } from "next/cache";

import type { Blog, BlogArticle } from "@/lib/blog/types";
import { fetchBlog, fetchBlogArticle } from "@/lib/shopify/operations/blogs/server";
import type { ShopifyLocale } from "@/lib/shopify/storefront/types";

export async function getBlog(params: {
  handle: string;
  limit?: number;
  locale?: ShopifyLocale;
}): Promise<Blog | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "blogs", `blog-${params.handle}`);

  return fetchBlog(params);
}

export async function getBlogArticle(params: {
  articleHandle: string;
  blogHandle: string;
  locale?: ShopifyLocale;
}): Promise<BlogArticle | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag(
    "articles",
    "blogs",
    `article-${params.blogHandle}-${params.articleHandle}`,
    `blog-${params.blogHandle}`,
  );

  return fetchBlogArticle(params);
}
