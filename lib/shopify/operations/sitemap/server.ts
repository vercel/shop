import { gql } from "@shopify/hydrogen";

import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import type {
  ArticleSitemapPage,
  ShopifySitemapType,
  SitemapResource,
} from "@/lib/shopify/operations/sitemap/types";
import { storefront } from "@/lib/shopify/storefront/server";

const GET_ARTICLE_SITEMAP_PAGE_QUERY = gql(`#graphql
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
`);

const GET_SITEMAP_PAGES_COUNT_QUERY = gql(`#graphql
  query getSitemapPagesCount($type: SitemapType!) {
    sitemap(type: $type) {
      pagesCount {
        count
      }
    }
  }
`);

const GET_SITEMAP_PAGE_QUERY = gql(`#graphql
  query getSitemapPage($type: SitemapType!, $page: Int!) {
    sitemap(type: $type) {
      resources(page: $page) {
        items {
          handle
          updatedAt
        }
      }
    }
  }
`);

export async function fetchSitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  const response = await storefront.request(GET_SITEMAP_PAGES_COUNT_QUERY, {
    variables: { type },
  });
  assertStorefrontOk(response, "getSitemapPagesCount");

  return response.data.sitemap.pagesCount?.count ?? 0;
}

// Article sitemap resources omit the blog handle that article URLs need, so articles page by cursor instead.
export async function fetchArticleSitemapPage(after: string | null): Promise<ArticleSitemapPage> {
  const response = await storefront.request(GET_ARTICLE_SITEMAP_PAGE_QUERY, {
    variables: { after, first: 250 },
  });
  assertStorefrontOk(response, "getArticleSitemapPage");

  const { nodes, pageInfo } = response.data.articles;
  return {
    endCursor: pageInfo.endCursor ?? null,
    hasNextPage: pageInfo.hasNextPage,
    items: nodes.map((article) => ({
      blogHandle: article.blog.handle,
      handle: article.handle,
      pathname: `/blogs/${article.blog.handle}/${article.handle}`,
      updatedAt: article.publishedAt,
    })),
  };
}

export async function fetchSitemapPage(
  type: Exclude<ShopifySitemapType, "ARTICLE">,
  page: number,
): Promise<{ items: SitemapResource[] }> {
  const response = await storefront.request(GET_SITEMAP_PAGE_QUERY, {
    variables: { type, page },
  });
  assertStorefrontOk(response, "getSitemapPage");

  const resources = response.data.sitemap.resources;
  if (!resources) return { items: [] };

  return {
    items: resources.items.map((item) => ({ handle: item.handle, updatedAt: item.updatedAt })),
  };
}
