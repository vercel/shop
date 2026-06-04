import { siteConfig } from "@/lib/config";
import { getSitemapIndex, SHOPIFY_SITEMAP_TYPES } from "@/lib/shopify/operations/sitemap";
import { createSitemapResponse, renderSitemapIndex } from "@/lib/sitemap";

export async function GET() {
  const sitemapIndex = await getSitemapIndex();
  const entries = [
    { pathname: "/sitemap/static/1.xml" },
    ...SHOPIFY_SITEMAP_TYPES.flatMap((type) =>
      Array.from({ length: sitemapIndex[type] }, (_, index) => ({
        pathname: `/sitemap/${type}/${index + 1}.xml`,
      })),
    ),
  ];

  return createSitemapResponse(renderSitemapIndex(siteConfig.url, entries));
}
