import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import { resolveBrowseParams } from "@/lib/collections/server";
import { markdownHeaders } from "@/lib/markdown/headers";
import { searchResultsToMarkdown } from "@/lib/markdown/search";
import { fetchSearchFacets, fetchSearchIndexProducts } from "@/lib/shopify/operations/products";

export async function GET(request: Request) {
  const url = new URL(request.url);
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
        limit: PRODUCTS_PER_PAGE,
        cursor,
        filters,
      }),
      fetchSearchFacets({
        activeFilters,
        query,
        collection,
        filters,
      }),
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
