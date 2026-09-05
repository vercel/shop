import { SlidersHorizontalIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SearchViewedTracker } from "@/components/analytics/trackers";
import {
  CollectionActiveFilterCountBadge,
  CollectionBrowseProvider,
} from "@/components/collections/collection-browse-provider";
import { FilterPendingScope } from "@/components/collections/filter-pending-context";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionFilters } from "@/components/collections/filters";
import { CollectionsSortSelect, SEARCH_SORT_EXCLUDE } from "@/components/collections/sort-select";
import { SortSelectFallback } from "@/components/collections/sort-select-fallback";
import { CollectionToolbar } from "@/components/collections/toolbar";
import { ProductsGridSkeleton } from "@/components/product/products-grid";
import {
  type SearchResultsData,
  SearchResultsGrid,
  getSearchResultsData,
} from "@/components/search/results";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import { getCollectionSearchState } from "@/lib/collections/server";
import { formatCount } from "@/lib/content";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = getParam(resolvedSearchParams, "q") ?? "";
  const hasQuery = query.length > 0;
  const title = hasQuery ? `Search results for "${query}"` : "Search";
  const description = hasQuery
    ? `Find products matching "${query}"`
    : "Search for products in our store";
  return {
    title,
    description,
    alternates: buildAlternates({
      pathname: "/search",
      searchParams: resolvedSearchParams,
    }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/search",
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  // Don't await searchParams here — it would force the route fully dynamic.
  const searchStatePromise = getCollectionSearchState(searchParams);
  const searchResultsDataPromise = (async () => {
    const resolved = await searchParams;
    return getSearchResultsData({
      collection: getParam(resolved, "collection"),
      query: getParam(resolved, "q"),
      searchStatePromise,
    });
  })();
  const filtersLabel = "Filters";
  const sortByLabel = "Sort";
  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <Suspense fallback={null}>
            <SearchAnalyticsTracker searchParamsPromise={searchParams} />
          </Suspense>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl">
              <Link href="/search">Search</Link>
              <Suspense fallback={null}>
                <SearchQueryLabel searchParamsPromise={searchParams} />
              </Suspense>
            </h1>
          </div>
          <Suspense
            fallback={
              <SearchBrowseFallback filtersLabel={filtersLabel} sortByLabel={sortByLabel} />
            }
          >
            <SearchBrowse
              filtersLabel={filtersLabel}
              searchParamsPromise={searchParams}
              searchResultsDataPromise={searchResultsDataPromise}
              searchStatePromise={searchStatePromise}
            />
          </Suspense>
        </Sections>
      </Container>
    </Page>
  );
}

async function SearchBrowse({
  filtersLabel,
  searchParamsPromise,
  searchResultsDataPromise,
  searchStatePromise,
}: {
  filtersLabel: string;
  searchParamsPromise: PageProps<"/search">["searchParams"];
  searchResultsDataPromise: Promise<SearchResultsData>;
  searchStatePromise: Promise<Awaited<ReturnType<typeof getCollectionSearchState>>>;
}) {
  const query = getParam(await searchParamsPromise, "q") ?? "";

  // A new term rebuilds the browse store so stale filters never carry across searches.
  return (
    <CollectionBrowseProvider handle={`search:${query}`} searchStatePromise={searchStatePromise}>
      <CollectionToolbar
        resultCount={
          <Suspense fallback={<Skeleton className="h-4 w-20" />}>
            <SearchResultCount dataPromise={searchResultsDataPromise} />
          </Suspense>
        }
        filterSheet={
          <FilterSidebarSheet
            label={filtersLabel}
            trigger={
              <button type="button" className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontalIcon className="size-4" />
                <span>{filtersLabel}</span>
                <CollectionActiveFilterCountBadge />
              </button>
            }
          >
            <FilterPendingScope>
              <CollectionFilters
                facetsPromise={searchResultsDataPromise.then((data) => data.transformedFilters)}
              />
            </FilterPendingScope>
          </FilterSidebarSheet>
        }
        sortSelect={<CollectionsSortSelect exclude={SEARCH_SORT_EXCLUDE} />}
      />
      <SearchResultsGrid searchResultsDataPromise={searchResultsDataPromise} />
    </CollectionBrowseProvider>
  );
}

function SearchBrowseFallback({
  filtersLabel,
  sortByLabel,
}: {
  filtersLabel: string;
  sortByLabel: string;
}) {
  return (
    <>
      <CollectionToolbar
        resultCount={<Skeleton className="h-4 w-20" />}
        filterSheet={
          <button type="button" className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontalIcon className="size-4" />
            <span>{filtersLabel}</span>
          </button>
        }
        sortSelect={<SortSelectFallback label={sortByLabel} />}
      />
      <ProductsGridSkeleton
        count={PRODUCTS_PER_PAGE}
        className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />
    </>
  );
}

async function SearchAnalyticsTracker({
  searchParamsPromise,
}: {
  searchParamsPromise: PageProps<"/search">["searchParams"];
}) {
  const query = getParam(await searchParamsPromise, "q");
  return <SearchViewedTracker searchTerm={query ?? ""} />;
}

async function SearchQueryLabel({
  searchParamsPromise,
}: {
  searchParamsPromise: PageProps<"/search">["searchParams"];
}) {
  const resolvedSearchParams = await searchParamsPromise;
  const query = getParam(resolvedSearchParams, "q");
  if (!query) return null;
  return ` for "${query}"`;
}

async function SearchResultCount({ dataPromise }: { dataPromise: Promise<SearchResultsData> }) {
  const data = await dataPromise;
  if (data.total === 0) return null;
  return formatCount(data.total, "Item");
}
