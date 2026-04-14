import { RESULTS_PER_PAGE } from "@/lib/utils/product-card";
import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { searchResultsToMarkdown } from "@/lib/markdown/search";
import {
  buildProductFiltersFromParams,
  getProducts,
} from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { parseFiltersFromSearchParams } from "@/lib/utils/filter-params";
import { searchParamsToRecord } from "@/lib/utils/url-search-params";

function markdownHeaders(cacheControl: string): HeadersInit {
  return {
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": cacheControl,
    Vary: "Accept",
    "X-Robots-Tag": "noindex",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") || defaultLocale);
  const query = url.searchParams.get("q") ?? undefined;
  const collection = url.searchParams.get("collection") ?? undefined;
  const sort = url.searchParams.get("sort") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const searchParams = searchParamsToRecord(url.searchParams);
  const activeFilters = parseFiltersFromSearchParams(searchParams);
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);

  try {
    const result = await getProducts({
      query,
      collection,
      sortKey: sort,
      limit: RESULTS_PER_PAGE,
      cursor,
      filters: shopifyFilters,
      locale,
    });

    const transformedFilters = transformShopifyFilters(result.filters, { activeFilters });
    const hasPriceRange = result.filters.some((filter) => filter.type === "PRICE_RANGE");
    const markdown = searchResultsToMarkdown({
      query,
      collection,
      products: result.products,
      total: result.total,
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
      "# Server Error\n\nAn error occurred while retrieving the search results. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders("no-cache, no-store, must-revalidate"),
      },
    );
  }
}
