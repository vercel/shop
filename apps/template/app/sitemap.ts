import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";
import { getAllLocalMarketingPageSlugs, getLocalMarketingPage } from "@/lib/content/pages";
import { commerce } from "@/lib/commerce";

function toAbsoluteUrl(pathname: string): string {
  return `${siteConfig.url}${pathname}`;
}

async function buildMarketingEntries(): Promise<MetadataRoute.Sitemap> {
  const pairs = getAllLocalMarketingPageSlugs();
  const uniqueSlugs = Array.from(new Map(pairs.map((pair) => [pair.slug, pair])).values());

  const pages = await Promise.all(
    uniqueSlugs.map(async (pair) => {
      const page = await getLocalMarketingPage(pair.slug, pair.locale);

      return {
        url: toAbsoluteUrl(`/pages/${pair.slug}`),
        lastModified: page?.publishedAt,
      };
    }),
  );

  return pages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products, marketingPages] = await Promise.all([
    commerce.collections.getCollections(),
    commerce.sitemap.getAllProductHandles(),
    buildMarketingEntries(),
  ]);

  const homeEntry: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl("/"),
    },
  ];

  const collectionEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: toAbsoluteUrl(`/collections/${collection.handle}`),
    lastModified: collection.updatedAt,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: toAbsoluteUrl(`/products/${product.handle}`),
    lastModified: product.updatedAt,
  }));

  return [...homeEntry, ...collectionEntries, ...productEntries, ...marketingPages];
}
