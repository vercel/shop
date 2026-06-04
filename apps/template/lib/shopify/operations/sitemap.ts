import { cacheLife, cacheTag } from "next/cache";

import { shopifyFetch } from "../fetch";

// Only publish Shopify resources with matching storefront routes.
export const SHOPIFY_SITEMAP_TYPES = ["collections", "products"] as const;

export type ShopifySitemapType = (typeof SHOPIFY_SITEMAP_TYPES)[number];

export interface ShopifySitemapResource {
  handle: string;
  type?: string;
  updatedAt: string;
}

interface SitemapIndexResponse {
  collections: SitemapPages;
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
    collections: sitemap(type: COLLECTION) {
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
  collections: "sitemapCollections",
  products: "sitemapProducts",
};

const SITEMAP_RESOURCE_QUERIES: Record<ShopifySitemapType, string> = {
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
