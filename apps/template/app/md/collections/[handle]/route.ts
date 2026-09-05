import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getAllProductsResultsData,
  resolveBrowseParams,
} from "@/lib/collections/server";
import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { collectionToMarkdown } from "@/lib/markdown/collection";
import { markdownHeaders } from "@/lib/markdown/headers";
import { notFoundMarkdown } from "@/lib/markdown/not-found";
import { RESULTS_PER_PAGE } from "@/lib/pagination";
import { getCollection } from "@/lib/shopify/operations/collections";
import { fetchCollectionProducts } from "@/lib/shopify/operations/products";

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") || defaultLocale);
  const pathname = `/collections/${handle}`;
  const searchState = resolveBrowseParams(url.searchParams);

  try {
    // /collections/all is local-only, so markdown must mirror the HTML data path.
    if (handle === ALL_PRODUCTS_HANDLE) {
      const searchStatePromise = Promise.resolve(searchState);
      const [collection, data] = await Promise.all([
        getAllProductsCollection(),
        getAllProductsResultsData({ locale, searchStatePromise }),
      ]);

      const markdown = collectionToMarkdown({
        collection,
        products: data.result.products,
        filters: data.result.filters,
        priceRange: data.result.priceRange,
        activeFilters: data.activeFilters,
        pageInfo: data.result.pageInfo,
        locale,
        sort: data.sort,
      });

      return new Response(markdown, {
        headers: markdownHeaders({
          cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
          pathname,
        }),
      });
    }

    const cursor = url.searchParams.get("cursor") ?? undefined;
    const { activeFilters, filters, sort } = searchState;

    // Same live read as the HTML page so agents and shoppers see one result set per URL.
    const [collection, result] = await Promise.all([
      getCollection({ handle, locale }),
      fetchCollectionProducts({
        activeFilters,
        collection: handle,
        sortKey: sort,
        limit: RESULTS_PER_PAGE,
        cursor,
        filters,
        locale,
      }),
    ]);

    if (!collection) {
      return new Response(notFoundMarkdown({ kind: "Collection", value: handle }), {
        status: 404,
        headers: markdownHeaders({
          cacheControl: "public, max-age=3600, stale-while-revalidate=604800",
          pathname,
        }),
      });
    }

    const markdown = collectionToMarkdown({
      collection,
      products: result.products,
      filters: result.filters,
      priceRange: result.priceRange,
      activeFilters,
      pageInfo: result.pageInfo,
      locale,
      sort,
    });

    return new Response(markdown, {
      headers: markdownHeaders({
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        pathname,
      }),
    });
  } catch {
    return new Response(
      "# Server Error\n\nAn error occurred while retrieving the collection. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders({
          cacheControl: "no-cache, no-store, must-revalidate",
          pathname,
        }),
      },
    );
  }
}
