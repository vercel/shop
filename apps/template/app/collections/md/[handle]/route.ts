import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { collectionToMarkdown } from "@/lib/markdown/collection";
import { getCollection } from "@/lib/shopify/operations/collections";
import {
  buildProductFiltersFromParams,
  getCollectionProducts,
} from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { RESULTS_PER_PAGE, parseFiltersFromSearchParams, searchParamsToRecord } from "@/lib/utils";

function markdownHeaders(cacheControl: string): HeadersInit {
  return {
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": cacheControl,
    Vary: "Accept",
    "X-Robots-Tag": "noindex",
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") || defaultLocale);
  const sort = url.searchParams.get("sort") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const searchParams = searchParamsToRecord(url.searchParams);
  const activeFilters = parseFiltersFromSearchParams(searchParams);
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);

  try {
    const [collection, result] = await Promise.all([
      getCollection(handle, locale),
      getCollectionProducts({
        collection: handle,
        sortKey: sort,
        limit: RESULTS_PER_PAGE,
        cursor,
        filtersJson: shopifyFilters.length > 0 ? JSON.stringify(shopifyFilters) : undefined,
        locale,
      }),
    ]);

    if (!collection) {
      return new Response(
        `# Collection Not Found\n\nThe collection with handle \`${handle}\` could not be found.`,
        {
          status: 404,
          headers: markdownHeaders("public, max-age=3600, stale-while-revalidate=604800"),
        },
      );
    }

    const transformedFilters = transformShopifyFilters(result.filters, { activeFilters });
    const hasPriceRange = result.filters.some((filter) => filter.type === "PRICE_RANGE");
    const markdown = collectionToMarkdown({
      collection,
      products: result.products,
      filters: transformedFilters.filters,
      priceRange: hasPriceRange ? transformedFilters.priceRange : undefined,
      activeFilters,
      pageInfo: result.pageInfo,
      locale,
      sort,
    });

    return new Response(markdown, {
      headers: markdownHeaders("public, max-age=86400, stale-while-revalidate=604800"),
    });
  } catch {
    return new Response(
      "# Server Error\n\nAn error occurred while retrieving the collection. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders("no-cache, no-store, must-revalidate"),
      },
    );
  }
}
