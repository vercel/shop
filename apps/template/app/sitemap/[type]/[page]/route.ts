import { siteConfig } from "@/lib/config";
import { getSitemapResources, isShopifySitemapType } from "@/lib/shopify/operations/sitemap";
import {
  createSitemapResponse,
  renderSitemap,
  toShopifySitemapEntries,
  type SitemapEntry,
} from "@/lib/sitemap";

const STATIC_SITEMAP_ENTRIES: SitemapEntry[] = [
  { pathname: "/" },
  { pathname: "/about" },
  { pathname: "/collections/all" },
];

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

function parseSitemapPage(segment: string): number | undefined {
  const match = /^([1-9]\d*)\.xml$/.exec(segment);
  if (!match) {
    return;
  }

  const page = Number(match[1]);
  return Number.isSafeInteger(page) ? page : undefined;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string; type: string }> },
) {
  const { page: pageSegment, type } = await params;
  const page = parseSitemapPage(pageSegment);

  if (!page) {
    return notFound();
  }

  if (type === "static") {
    return page === 1
      ? createSitemapResponse(renderSitemap(siteConfig.url, STATIC_SITEMAP_ENTRIES))
      : notFound();
  }

  if (!isShopifySitemapType(type)) {
    return notFound();
  }

  const resources = await getSitemapResources({ page, type });
  return createSitemapResponse(
    renderSitemap(siteConfig.url, toShopifySitemapEntries(type, resources)),
  );
}
