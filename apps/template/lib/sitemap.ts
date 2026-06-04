import type { ShopifySitemapResource, ShopifySitemapType } from "@/lib/shopify/operations/sitemap";

export interface SitemapEntry {
  lastModified?: string;
  pathname: string;
}

export interface SitemapIndexEntry {
  pathname: string;
}

const SITEMAP_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  "Content-Type": "application/xml",
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toAbsoluteUrl(baseUrl: string, pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPathname}`;
}

export function createSitemapResponse(xml: string): Response {
  return new Response(xml, { headers: SITEMAP_HEADERS });
}

export function renderSitemap(baseUrl: string, entries: SitemapEntry[]): string {
  const urls = entries
    .map(({ lastModified, pathname }) => {
      const lastModifiedElement = lastModified
        ? `\n    <lastmod>${escapeXml(lastModified)}</lastmod>`
        : "";

      return `  <url>
    <loc>${escapeXml(toAbsoluteUrl(baseUrl, pathname))}</loc>${lastModifiedElement}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function renderSitemapIndex(baseUrl: string, entries: SitemapIndexEntry[]): string {
  const sitemaps = entries
    .map(
      ({ pathname }) => `  <sitemap>
    <loc>${escapeXml(toAbsoluteUrl(baseUrl, pathname))}</loc>
  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}

export function toShopifySitemapEntries(
  type: ShopifySitemapType,
  resources: ShopifySitemapResource[],
): SitemapEntry[] {
  return resources.map((resource) => ({
    lastModified: resource.updatedAt,
    pathname: `/${resource.type ?? type}/${resource.handle}`,
  }));
}
