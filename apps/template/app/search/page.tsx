import { SlidersHorizontalIcon } from "lucide-react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
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
import { getCollectionSearchState } from "@/lib/collections/server";
import { RESULTS_PER_PAGE } from "@/lib/pagination";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("seo");
  const query = getParam(resolvedSearchParams, "q") ?? "";
  const hasQuery = query.length > 0;
  const title = hasQuery ? t("searchTitleQuery", { query }) : t("searchTitle");
  const description = hasQuery ? t("searchDescriptionQuery", { query }) : t("searchDescription");

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

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const [locale, messages, t] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("search"),
  ]);

  // Don't await searchParams here — it would force the route fully dynamic.
  const searchStatePromise = getCollectionSearchState(searchParams);
  const searchResultsDataPromise = (async () => {
    const resolved = await searchParams;
    return getSearchResultsData({
      collection: getParam(resolved, "collection"),
      locale,
      query: getParam(resolved, "q"),
      searchStatePromise,
    });
  })();

  const filtersLabel = t("filters");
  const sortByLabel = t("sortBy");

  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <Suspense fallback={null}>
            <SearchAnalyticsTracker searchParamsPromise={searchParams} />
          </Suspense>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl">
              <Link href="/search">{t("title")}</Link>
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
            <NextIntlClientProvider
              messages={{ category: messages.category, search: messages.search }}
            >
              <SearchBrowse
                filtersLabel={filtersLabel}
                locale={locale}
                searchParamsPromise={searchParams}
                searchResultsDataPromise={searchResultsDataPromise}
                searchStatePromise={searchStatePromise}
              />
            </NextIntlClientProvider>
          </Suspense>
        </Sections>
      </Container>
    </Page>
  );
}

async function SearchBrowse({
  filtersLabel,
  locale,
  searchParamsPromise,
  searchResultsDataPromise,
  searchStatePromise,
}: {
  filtersLabel: string;
  locale: Awaited<ReturnType<typeof getLocale>>;
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
      <SearchResultsGrid locale={locale} searchResultsDataPromise={searchResultsDataPromise} />
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
        count={RESULTS_PER_PAGE}
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
  const [resolvedSearchParams, t] = await Promise.all([
    searchParamsPromise,
    getTranslations("search"),
  ]);
  const query = getParam(resolvedSearchParams, "q");
  if (!query) return null;
  return t("forQuery", { query });
}

async function SearchResultCount({ dataPromise }: { dataPromise: Promise<SearchResultsData> }) {
  const [data, t] = await Promise.all([dataPromise, getTranslations("search")]);
  if (data.total === 0) return null;
  return t("resultCount", { count: data.total });
}
