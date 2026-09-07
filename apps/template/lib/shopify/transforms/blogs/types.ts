import type { ARTICLE_SUMMARY_FRAGMENT, BLOG_FRAGMENT } from "@/lib/shopify/fragments/blogs";
import type { ResultOf } from "@/lib/shopify/types";

export type ShopifyBlog = ResultOf<typeof BLOG_FRAGMENT>;

export type ShopifyArticle = ResultOf<typeof ARTICLE_SUMMARY_FRAGMENT> & {
  contentHtml?: string;
  seo?: { description: string | null; title: string | null } | null;
  tags?: string[];
};
