import { notFound } from "next/navigation";

import { siteConfig } from "@/lib/config";
import { enabledLocales } from "@/lib/i18n";
import { getShopifySitemapPage, type ShopifySitemapType } from "@/lib/shopify/operations/sitemap";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toAbsoluteUrl(pathname: string): string {
  return `${siteConfig.url}${pathname}`;
}

function urlsetWrap(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

function localizePath(locale: string, pathname: string): string {
  if (pathname === "/") return `/${locale}`;
  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

// One <url> per enabled locale, each carrying the full set of hreflang
// alternates (including itself) so crawlers can resolve every translation.
function localizedUrls(pathname: string, lastmod?: string): string {
  const alternates = enabledLocales
    .map((locale) => {
      const href = escapeXml(toAbsoluteUrl(localizePath(locale, pathname)));
      return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
    })
    .join("\n");

  return enabledLocales
    .map((locale) => {
      const loc = escapeXml(toAbsoluteUrl(localizePath(locale, pathname)));
      const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmodLine}\n${alternates}\n  </url>`;
    })
    .join("\n");
}

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function renderStatic(): Response {
  return xmlResponse(urlsetWrap(localizedUrls("/")));
}

async function renderShard(
  type: ShopifySitemapType,
  page: number,
  segment: string,
): Promise<Response> {
  const { items } = await getShopifySitemapPage(type, page);

  const entries = items
    .map((item) => localizedUrls(`/${segment}/${item.handle}`, item.updatedAt))
    .join("\n");

  return xmlResponse(urlsetWrap(entries));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shard: string }> },
): Promise<Response> {
  const { shard } = await params;
  const id = shard.endsWith(".xml") ? shard.slice(0, -".xml".length) : shard;

  if (id === "static") return renderStatic();

  const match = id.match(/^(products|collections)-(\d+)$/);
  if (!match) notFound();

  const type: ShopifySitemapType = match[1] === "products" ? "PRODUCT" : "COLLECTION";
  const page = Number(match[2]);

  return renderShard(type, page, match[1]);
}
