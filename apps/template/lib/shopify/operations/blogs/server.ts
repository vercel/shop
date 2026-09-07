import { gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import type { Blog, BlogArticle } from "@/lib/blog/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { ARTICLE_SUMMARY_FRAGMENT, BLOG_FRAGMENT } from "@/lib/shopify/fragments/blogs";
import { storefront } from "@/lib/shopify/storefront/server";
import { transformArticle } from "@/lib/shopify/transforms/blogs";

const GET_BLOG_QUERY = gql(
  `#graphql
  query getBlog($handle: String!, $first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    blog(handle: $handle) {
      ...BlogFields
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          ...ArticleSummaryFields
        }
      }
    }
  }
`,
  [ARTICLE_SUMMARY_FRAGMENT, BLOG_FRAGMENT],
);

const GET_BLOG_ARTICLE_QUERY = gql(
  `#graphql
  query getBlogArticle($blogHandle: String!, $articleHandle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      ...BlogFields
      articleByHandle(handle: $articleHandle) {
        ...ArticleSummaryFields
        contentHtml
        seo {
          description
          title
        }
        tags
      }
    }
  }
`,
  [ARTICLE_SUMMARY_FRAGMENT, BLOG_FRAGMENT],
);

export async function getBlog({
  handle,
  limit = 50,
  locale = shopConfig.localization,
}: {
  handle: string;
  limit?: number;
  locale?: CommerceLocale;
}): Promise<Blog | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "blogs", `blog-${handle}`);

  const response = await storefront.request(GET_BLOG_QUERY, {
    locale,
    variables: { first: limit, handle },
  });
  assertStorefrontOk(response, "getBlog");

  const blog = response.data.blog;
  if (!blog) return undefined;

  return {
    articles: blog.articles.nodes.map((article) => transformArticle(article, blog)),
    handle: blog.handle,
    seo: {
      description: blog.seo?.description ?? "",
      title: blog.seo?.title ?? blog.title,
    },
    title: blog.title,
  };
}

export async function getBlogArticle({
  articleHandle,
  blogHandle,
  locale = shopConfig.localization,
}: {
  articleHandle: string;
  blogHandle: string;
  locale?: CommerceLocale;
}): Promise<BlogArticle | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "blogs", `article-${blogHandle}-${articleHandle}`, `blog-${blogHandle}`);

  const response = await storefront.request(GET_BLOG_ARTICLE_QUERY, {
    locale,
    variables: { articleHandle, blogHandle },
  });
  assertStorefrontOk(response, "getBlogArticle");

  const blog = response.data.blog;
  if (!blog?.articleByHandle) return undefined;

  return transformArticle(blog.articleByHandle, blog);
}
