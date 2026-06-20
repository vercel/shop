import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getAllProductsResultsData,
  getCollectionSearchState,
} from "@/lib/collections/server";
import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { collectionToMarkdown } from "@/lib/markdown/collection";
import { getCollection } from "@/lib/shopify/operations/collections";
import {
  buildProductFiltersFromParams,
  getCollectionProducts,
} from "@/lib/shopify/operations/products";
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
  const searchParams = searchParamsToRecord(url.searchParams);

  try {
    // /collections/all is a virtual route with no Shopify equivalent; mirror the HTML
    // page's data path so the same URL is legible to markdown-negotiating agents.
    if (handle === ALL_PRODUCTS_HANDLE) {
      const searchStatePromise = getCollectionSearchState(Promise.resolve(searchParams));
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
        headers: markdownHeaders("public, max-age=86400, stale-while-revalidate=604800"),
      });
    }

    const sort = url.searchParams.get("sort") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const activeFilters = parseFiltersFromSearchParams(searchParams);
    const shopifyFilters = buildProductFiltersFromParams(activeFilters);

    const [collection, result] = await Promise.all([
      getCollection({ handle, locale }),
      getCollectionProducts({
        activeFilters,
        collection: handle,
        sortKey: sort,
        limit: RESULTS_PER_PAGE,
        cursor,
        filters: shopifyFilters,
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
