import { notFound } from "next/navigation";

import { siteConfig } from "@/lib/config";
import { getShopifySitemapPage, type ShopifySitemapType } from "@/lib/shopify/operations/sitemap";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toAbsoluteUrl(pathname: string): string {
  return `${siteConfig.url}${pathname}`;
}

function urlsetWrap(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function renderStatic(): Response {
  const entry = `  <url><loc>${escapeXml(toAbsoluteUrl("/"))}</loc></url>`;
  return xmlResponse(urlsetWrap(entry));
}

async function renderShard(
  type: ShopifySitemapType,
  page: number,
  segment: string,
): Promise<Response> {
  const { items } = await getShopifySitemapPage(type, page);

  const entries = items
    .map((item) => {
      const loc = escapeXml(toAbsoluteUrl(`/${segment}/${item.handle}`));
      const lastmod = escapeXml(item.updatedAt);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    })
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
