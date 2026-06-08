import { siteConfig } from "@/lib/config";
import { getShopifySitemapPagesCount } from "@/lib/shopify/operations/sitemap";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(): Promise<Response> {
  const [productPages, collectionPages] = await Promise.all([
    getShopifySitemapPagesCount("PRODUCT"),
    getShopifySitemapPagesCount("COLLECTION"),
  ]);

  const childIds = [
    "static",
    ...Array.from({ length: productPages }, (_, i) => `products-${i + 1}`),
    ...Array.from({ length: collectionPages }, (_, i) => `collections-${i + 1}`),
  ];

  const entries = childIds
    .map(
      (id) => `  <sitemap><loc>${escapeXml(`${siteConfig.url}/sitemap/${id}.xml`)}</loc></sitemap>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
