import type { GraphQLFormattedError } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { assertStorefrontOk } from "../errors";
import { storefront } from "../storefront";

export type ShopifySitemapType = "ARTICLE" | "BLOG" | "COLLECTION" | "PAGE" | "PRODUCT";

export interface SitemapResource {
  handle: string;
  pathname?: string;
  updatedAt: string;
}

interface StorefrontResponse<T> {
  data?: T | null;
  errors?: GraphQLFormattedError[];
}

interface ArticleSitemapPageResponse {
  articles: {
    nodes: Array<{
      blog: { handle: string };
      handle: string;
      publishedAt: string;
    }>;
    pageInfo: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
  };
}

const GET_ARTICLE_SITEMAP_PAGE_QUERY = `#graphql
  query getArticleSitemapPage($first: Int!, $after: String) {
    articles(first: $first, after: $after, sortKey: UPDATED_AT) {
      nodes {
        blog {
          handle
        }
        handle
        publishedAt
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
` as const;

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
  if (type === "ARTICLE") return ["articles", "articles-index"];
  if (type === "BLOG") return ["blogs", "blogs-index"];
  if (type === "COLLECTION") return ["collections", "collections-index"];
  return type === "PAGE" ? ["pages"] : ["products", "products-index"];
}

function tagSitemapResources(type: ShopifySitemapType, resources: SitemapResource[]): void {
  if (type === "ARTICLE" || type === "PAGE") return;

  const prefix = type === "BLOG" ? "blog" : type === "COLLECTION" ? "collection" : "product";
  for (const resource of resources) {
    cacheTag(`${prefix}-${resource.handle}`);
  }
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  "use cache: remote";
  if (type === "PAGE") {
    cacheLife("hours");
  } else {
    cacheLife("max");
  }
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
  if (type === "PAGE") {
    cacheLife("hours");
  } else {
    cacheLife("max");
  }
  cacheTag(...cacheTagsFor(type));

  if (type === "ARTICLE") {
    let after: string | null = null;
    let articlePage: ArticleSitemapPageResponse["articles"] | undefined;

    for (let currentPage = 1; currentPage <= page; currentPage += 1) {
      const response: StorefrontResponse<ArticleSitemapPageResponse> =
        await storefront.request<ArticleSitemapPageResponse>(GET_ARTICLE_SITEMAP_PAGE_QUERY, {
          variables: { after, first: 250 },
        });
      assertStorefrontOk(response, "getArticleSitemapPage");
      articlePage = response.data.articles;
      after = articlePage.pageInfo.endCursor;

      if (!articlePage.pageInfo.hasNextPage && currentPage < page) {
        return { hasNextPage: false, items: [] };
      }
    }

    return {
      hasNextPage: articlePage?.pageInfo.hasNextPage ?? false,
      items:
        articlePage?.nodes.map((article) => {
          cacheTag(`article-${article.blog.handle}-${article.handle}`);
          return {
            handle: article.handle,
            pathname: `/blogs/${article.blog.handle}/${article.handle}`,
            updatedAt: article.publishedAt,
          };
        }) ?? [],
    };
  }

  const response = await storefront.request<{
    sitemap: { resources: { hasNextPage: boolean; items: SitemapResource[] } };
  }>(GET_SITEMAP_PAGE_QUERY, {
    variables: { type, page },
  });
  assertStorefrontOk(response, "getSitemapPage");

  const resources = response.data.sitemap.resources;
  tagSitemapResources(type, resources.items);
  return resources;
}
