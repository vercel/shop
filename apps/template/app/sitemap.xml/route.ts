import { getShopifySitemapPagesCount } from "@/lib/shopify/operations/sitemap";
import { shopConfig } from "@/shop.config";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(): Promise<Response> {
  const [articlePages, blogPages, collectionPages, pagePages, productPages] = await Promise.all([
    getShopifySitemapPagesCount("ARTICLE"),
    getShopifySitemapPagesCount("BLOG"),
    getShopifySitemapPagesCount("COLLECTION"),
    getShopifySitemapPagesCount("PAGE"),
    getShopifySitemapPagesCount("PRODUCT"),
  ]);

  const childIds = [
    "static",
    ...Array.from({ length: productPages }, (_, i) => `products-${i + 1}`),
    ...Array.from({ length: collectionPages }, (_, i) => `collections-${i + 1}`),
    ...Array.from({ length: pagePages }, (_, i) => `pages-${i + 1}`),
    ...Array.from({ length: blogPages }, (_, i) => `blogs-${i + 1}`),
    ...Array.from({ length: articlePages }, (_, i) => `articles-${i + 1}`),
  ];

  const entries = childIds
    .map(
      (id) =>
        `  <sitemap><loc>${escapeXml(`${shopConfig.site.url}/sitemap/${id}.xml`)}</loc></sitemap>`,
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
