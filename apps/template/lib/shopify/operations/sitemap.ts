import { cacheLife, cacheTag } from "next/cache";

import { shopifyFetch } from "../fetch";

export const SHOPIFY_SITEMAP_TYPES = [
  "articles",
  "blogs",
  "collections",
  "metaObjects",
  "pages",
  "products",
] as const;

export type ShopifySitemapType = (typeof SHOPIFY_SITEMAP_TYPES)[number];

export interface ShopifySitemapResource {
  handle: string;
  type?: string;
  updatedAt: string;
}

interface SitemapIndexResponse {
  articles: SitemapPages;
  blogs: SitemapPages;
  collections: SitemapPages;
  metaObjects: SitemapPages;
  pages: SitemapPages;
  products: SitemapPages;
}

interface SitemapPages {
  pagesCount: {
    count: number;
  };
}

interface SitemapResourcesResponse {
  sitemap: {
    resources: {
      items: ShopifySitemapResource[];
    };
  };
}

const SITEMAP_INDEX_QUERY = `
  query sitemapIndex {
    articles: sitemap(type: ARTICLE) {
      pagesCount {
        count
      }
    }
    blogs: sitemap(type: BLOG) {
      pagesCount {
        count
      }
    }
    collections: sitemap(type: COLLECTION) {
      pagesCount {
        count
      }
    }
    metaObjects: sitemap(type: METAOBJECT) {
      pagesCount {
        count
      }
    }
    pages: sitemap(type: PAGE) {
      pagesCount {
        count
      }
    }
    products: sitemap(type: PRODUCT) {
      pagesCount {
        count
      }
    }
  }
`;

const SITEMAP_RESOURCE_OPERATIONS: Record<ShopifySitemapType, string> = {
  articles: "sitemapArticles",
  blogs: "sitemapBlogs",
  collections: "sitemapCollections",
  metaObjects: "sitemapMetaObjects",
  pages: "sitemapPages",
  products: "sitemapProducts",
};

const SITEMAP_RESOURCE_QUERIES: Record<ShopifySitemapType, string> = {
  articles: `
    query sitemapArticles($page: Int!) {
      sitemap(type: ARTICLE) {
        resources(page: $page) {
          items {
            handle
            updatedAt
          }
        }
      }
    }
  `,
  blogs: `
    query sitemapBlogs($page: Int!) {
      sitemap(type: BLOG) {
        resources(page: $page) {
          items {
            handle
            updatedAt
          }
        }
      }
    }
  `,
  collections: `
    query sitemapCollections($page: Int!) {
      sitemap(type: COLLECTION) {
        resources(page: $page) {
          items {
            handle
            updatedAt
          }
        }
      }
    }
  `,
  metaObjects: `
    query sitemapMetaObjects($page: Int!) {
      sitemap(type: METAOBJECT) {
        resources(page: $page) {
          items {
            handle
            updatedAt
            ... on SitemapResourceMetaobject {
              type
            }
          }
        }
      }
    }
  `,
  pages: `
    query sitemapPages($page: Int!) {
      sitemap(type: PAGE) {
        resources(page: $page) {
          items {
            handle
            updatedAt
          }
        }
      }
    }
  `,
  products: `
    query sitemapProducts($page: Int!) {
      sitemap(type: PRODUCT) {
        resources(page: $page) {
          items {
            handle
            updatedAt
          }
        }
      }
    }
  `,
};

export async function getSitemapIndex(): Promise<Record<ShopifySitemapType, number>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sitemap");

  const data = await shopifyFetch<SitemapIndexResponse>({
    operation: "sitemapIndex",
    query: SITEMAP_INDEX_QUERY,
  });

  return Object.fromEntries(
    SHOPIFY_SITEMAP_TYPES.map((type) => [type, data[type].pagesCount.count]),
  ) as Record<ShopifySitemapType, number>;
}

export async function getSitemapResources({
  page,
  type,
}: {
  page: number;
  type: ShopifySitemapType;
}): Promise<ShopifySitemapResource[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("sitemap");

  const data = await shopifyFetch<SitemapResourcesResponse>({
    operation: SITEMAP_RESOURCE_OPERATIONS[type],
    query: SITEMAP_RESOURCE_QUERIES[type],
    variables: { page },
  });

  return data.sitemap.resources.items;
}

export function isShopifySitemapType(type: string): type is ShopifySitemapType {
  return SHOPIFY_SITEMAP_TYPES.includes(type as ShopifySitemapType);
}
