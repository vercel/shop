import { cacheLife, cacheTag } from "next/cache";

import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import type { Blog, BlogArticle } from "@/lib/types";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

interface ShopifyArticle {
  authorV2: { name: string } | null;
  content: string;
  contentHtml?: string;
  excerpt: string | null;
  handle: string;
  image: {
    altText: string | null;
    height: number;
    url: string;
    width: number;
  } | null;
  publishedAt: string;
  seo?: {
    description: string | null;
    title: string | null;
  } | null;
  tags?: string[];
  title: string;
}

interface ShopifyBlog {
  handle: string;
  seo: {
    description: string | null;
    title: string | null;
  } | null;
  title: string;
}

interface GetBlogResponse {
  blog: (ShopifyBlog & { articles: { nodes: ShopifyArticle[] } }) | null;
}

interface GetBlogArticleResponse {
  blog: (ShopifyBlog & { articleByHandle: ShopifyArticle | null }) | null;
}

const GET_BLOG_QUERY = `#graphql
  query getBlog($handle: String!, $first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    blog(handle: $handle) {
      handle
      seo {
        description
        title
      }
      title
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
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
      }
    }
  }
` as const;

const GET_BLOG_ARTICLE_QUERY = `#graphql
  query getBlogArticle($blogHandle: String!, $articleHandle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      handle
      seo {
        description
        title
      }
      title
      articleByHandle(handle: $articleHandle) {
        authorV2 {
          name
        }
        content(truncateAt: 240)
        contentHtml
        excerpt
        handle
        image {
          altText
          height
          url
          width
        }
        publishedAt
        seo {
          description
          title
        }
        tags
        title
      }
    }
  }
` as const;

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
          height: article.image.height,
          url: article.image.url,
          width: article.image.width,
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

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const response = await storefront.request<GetBlogResponse>(GET_BLOG_QUERY, {
    variables: { country, first: limit, handle, language },
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

  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);
  const response = await storefront.request<GetBlogArticleResponse>(GET_BLOG_ARTICLE_QUERY, {
    variables: { articleHandle, blogHandle, country, language },
  });
  assertStorefrontOk(response, "getBlogArticle");

  const blog = response.data.blog;
  if (!blog?.articleByHandle) return undefined;

  return transformArticle(blog.articleByHandle, blog);
}
