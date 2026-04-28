import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";
import { enabledLocales } from "@/lib/i18n";
import { getCollections } from "@/lib/shopify/operations/collections";
import { getAllProductHandles } from "@/lib/shopify/operations/sitemap";

function localizePath(locale: string, pathname: string): string {
  if (pathname === "/") return `/${locale}`;
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${normalized}`;
}

function toAbsoluteUrl(pathname: string): string {
  return `${siteConfig.url}${pathname}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products] = await Promise.all([getCollections(), getAllProductHandles()]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of enabledLocales) {
    entries.push({ url: toAbsoluteUrl(localizePath(locale, "/")) });

    for (const collection of collections) {
      entries.push({
        url: toAbsoluteUrl(localizePath(locale, `/collections/${collection.handle}`)),
        lastModified: collection.updatedAt,
      });
    }

    for (const product of products) {
      entries.push({
        url: toAbsoluteUrl(localizePath(locale, `/products/${product.handle}`)),
        lastModified: product.updatedAt,
      });
    }
  }

  return entries;
}
