import { notFound } from "next/navigation";

import { getShopPolicies } from "@/lib/shopify/operations/policies";
import { getShopifySitemapPage, type ShopifySitemapType } from "@/lib/shopify/operations/sitemap";
import { shopConfig } from "@/shop.config";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toAbsoluteUrl(pathname: string): string {
  return `${shopConfig.site.url}${pathname}`;
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

async function renderStatic(): Promise<Response> {
  const policies = await getShopPolicies().catch(() => []);
  const entries = ["/", ...policies.map(({ handle }) => `/policies/${handle}`)]
    .map((pathname) => `  <url><loc>${escapeXml(toAbsoluteUrl(pathname))}</loc></url>`)
    .join("\n");
  return xmlResponse(urlsetWrap(entries));
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

  const match = id.match(/^(collections|pages|products)-(\d+)$/);
  if (!match) notFound();

  const segment = match[1];
  const types: Record<string, ShopifySitemapType> = {
    collections: "COLLECTION",
    pages: "PAGE",
    products: "PRODUCT",
  };
  const type = types[segment];
  if (!type) notFound();

  return renderShard(type, Number(match[2]), segment);
}
