import { gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale } from "@/lib/i18n";
import type { Blog, BlogArticle } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { type ResultOf, storefront } from "../storefront";

const ARTICLE_SUMMARY_FRAGMENT = gql(`#graphql
  fragment ArticleSummaryFields on Article {
    authorV2 {
      name
    }
    content(truncateAt: 240)
    excerpt
    handle
    image {
      altText
      height
      url
      width
    }
    publishedAt
    title
  }
`);

const BLOG_FRAGMENT = gql(`#graphql
  fragment BlogFields on Blog {
    handle
    seo {
      description
      title
    }
    title
  }
`);

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

type ShopifyBlog = ResultOf<typeof BLOG_FRAGMENT>;
type ShopifyArticle = ResultOf<typeof ARTICLE_SUMMARY_FRAGMENT> & {
  contentHtml?: string;
  seo?: { description: string | null; title: string | null } | null;
  tags?: string[];
};

function transformArticle(article: ShopifyArticle, blog: ShopifyBlog): BlogArticle {
  return {
    author: article.authorV2?.name,
    blogHandle: blog.handle,
    blogTitle: blog.title,
    body: article.contentHtml,
    excerpt: article.excerpt ?? article.content,
    handle: article.handle,
    image: article.image
      ? {
          altText: article.image.altText ?? article.title,
          height: article.image.height ?? 0,
          url: article.image.url,
          width: article.image.width ?? 0,
        }
      : null,
    publishedAt: article.publishedAt,
    seo: {
      description: article.seo?.description ?? article.excerpt ?? article.content,
      title: article.seo?.title ?? article.title,
    },
    tags: article.tags ?? [],
    title: article.title,
  };
}

export async function getBlog({
  handle,
  limit = 50,
  locale = defaultLocale,
}: {
  handle: string;
  limit?: number;
  locale?: string;
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
  locale = defaultLocale,
}: {
  articleHandle: string;
  blogHandle: string;
  locale?: string;
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
