import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { searchResultsToMarkdown } from "@/lib/markdown/search";
import {
  buildProductFiltersFromParams,
  getCatalogProducts,
  getSearchFacets,
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
    const [catalog, facets] = await Promise.all([
      getCatalogProducts({
        query,
        collection,
        sortKey: sort,
        limit: RESULTS_PER_PAGE,
        cursor,
        filters: shopifyFilters,
        locale,
      }),
      getSearchFacets({ query, collection, filters: shopifyFilters, locale }),
    ]);

    const transformedFilters = transformShopifyFilters(facets.filters, { activeFilters });
    const hasPriceRange = facets.filters.some((filter) => filter.type === "PRICE_RANGE");
    const markdown = searchResultsToMarkdown({
      query,
      collection,
      products: catalog.products,
      total: facets.total,
      filters: transformedFilters.filters,
      priceRange: hasPriceRange ? transformedFilters.priceRange : undefined,
      activeFilters,
      pageInfo: catalog.pageInfo,
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
