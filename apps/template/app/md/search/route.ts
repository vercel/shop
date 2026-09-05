import { resolveBrowseParams } from "@/lib/collections/server";
import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { markdownHeaders } from "@/lib/markdown/headers";
import { searchResultsToMarkdown } from "@/lib/markdown/search";
import { fetchSearchFacets, fetchSearchIndexProducts } from "@/lib/shopify/operations/products";
import { RESULTS_PER_PAGE } from "@/lib/utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") || defaultLocale);
  const query = url.searchParams.get("q") ?? undefined;
  const collection = url.searchParams.get("collection") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const { activeFilters, filters, sort } = resolveBrowseParams(url.searchParams);

  try {
    // Same live reads as the HTML page so agents and shoppers see one result set per URL.
    const [results, facets] = await Promise.all([
      fetchSearchIndexProducts({
        query,
        collection,
        sortKey: sort,
        limit: RESULTS_PER_PAGE,
        cursor,
        filters,
        locale,
      }),
      fetchSearchFacets({ activeFilters, query, collection, filters, locale }),
    ]);

    const markdown = searchResultsToMarkdown({
      query,
      collection,
      products: results.products,
      total: facets.total,
      filters: facets.filters,
      priceRange: facets.priceRange,
      activeFilters,
      pageInfo: results.pageInfo,
      locale,
      sort,
    });

    return new Response(markdown, {
      headers: markdownHeaders({
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        pathname: "/search",
      }),
    });
  } catch {
    return new Response(
      "# Server Error\n\nAn error occurred while retrieving the search results. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders({
          cacheControl: "no-cache, no-store, must-revalidate",
          pathname: "/search",
        }),
      },
    );
  }
}
