import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";
import { getCollections } from "@/lib/shopify/operations/collections";
import { getAllProductHandles } from "@/lib/shopify/operations/sitemap";

function toAbsoluteUrl(pathname: string): string {
  return `${siteConfig.url}${pathname}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products] = await Promise.all([
    getCollections(),
    getAllProductHandles(),
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

  return [...homeEntry, ...collectionEntries, ...productEntries];
}
