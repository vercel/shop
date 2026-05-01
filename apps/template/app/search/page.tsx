import { SlidersHorizontalIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import {
  FilterPendingScope,
  FilterTransitionProvider,
} from "@/components/collections/filter-pending-context";
import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { SortSelectFallback } from "@/components/collections/sort-select-fallback";
import { CollectionToolbar } from "@/components/collections/toolbar";
import {
  type SearchResultsData,
  SearchResultsGrid,
  getSearchResultsData,
} from "@/components/search/results";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { parseFiltersFromSearchParams } from "@/lib/utils";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("seo");
  const q = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams.q;
  const query = q ?? "";
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

export const unstable_instant = {
  samples: [
    {
      searchParams: {
        q: "__placeholder__",
        collection: null,
        sort: null,
      },
      cookies: [{ name: "shopify_cartId", value: null }],
      headers: [["x-vercel-ip-postal-code", null]],
    },
  ],
};

export const unstable_prefetch = "force-runtime";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("search")]);

  // searchParams is a Promise; awaiting it at the page level would force the
  // route fully dynamic, so we kick off the data fetch as a derived promise
  // and let child Suspense boundaries await it.
  const searchResultsDataPromise = (async () => {
    const resolved = await searchParams;
    return getSearchResultsData({
      query: resolved.q as string | undefined,
      sort: resolved.sort as string | undefined,
      collection: resolved.collection as string | undefined,
      locale,
      activeFilters: parseFiltersFromSearchParams(resolved),
    });
  })();

  const filtersLabel = t("filters");

  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <FilterTransitionProvider>
          <Sections className="gap-5">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
                <Link href="/search">{t("title")}</Link>
                <Suspense fallback={null}>
                  <SearchQueryLabel searchParamsPromise={searchParams} />
                </Suspense>
              </h1>
            </div>
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
                      <Suspense fallback={null}>
                        <SearchFilterCountBadge searchParamsPromise={searchParams} />
                      </Suspense>
                    </button>
                  }
                >
                  <FilterPendingScope>
                    <Suspense fallback={<CollectionFilterSidebarSkeleton />}>
                      <SearchFilterSidebarContent
                        dataPromise={searchResultsDataPromise}
                        searchParamsPromise={searchParams}
                      />
                    </Suspense>
                  </FilterPendingScope>
                </FilterSidebarSheet>
              }
              sortSelect={
                <Suspense fallback={<SortSelectFallback label={t("sortBy")} />}>
                  <CollectionsSortSelect
                    exclude={[
                      "product-name-ascending",
                      "product-name-descending",
                      "best-selling",
                      "date-old-to-new",
                      "date-new-to-old",
                    ]}
                  />
                </Suspense>
              }
            />
            <SearchResultsGrid
              locale={locale}
              searchResultsDataPromise={searchResultsDataPromise}
            />
          </Sections>
        </FilterTransitionProvider>
      </Container>
    </Page>
  );
}

async function SearchQueryLabel({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolvedSearchParams, t] = await Promise.all([
    searchParamsPromise,
    getTranslations("search"),
  ]);
  const raw = resolvedSearchParams.q;
  const query = Array.isArray(raw) ? raw[0] : raw;
  if (!query) return null;
  return t("forQuery", { query });
}

async function SearchResultCount({ dataPromise }: { dataPromise: Promise<SearchResultsData> }) {
  const [data, t] = await Promise.all([dataPromise, getTranslations("search")]);
  if (data.total === 0) return null;
  return t("resultCount", { count: data.total });
}

async function SearchFilterCountBadge({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParamsPromise;
  const activeFilters = parseFiltersFromSearchParams(resolved);
  const activeFilterCount = Object.values(activeFilters).reduce((count, v) => {
    if (!v) return count;
    return count + (Array.isArray(v) ? v.length : 1);
  }, 0);
  if (activeFilterCount === 0) return null;
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
      {activeFilterCount}
    </span>
  );
}

async function SearchFilterSidebarContent({
  dataPromise,
  searchParamsPromise,
}: {
  dataPromise: Promise<SearchResultsData>;
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [data, resolved] = await Promise.all([dataPromise, searchParamsPromise]);
  const activeFilters = parseFiltersFromSearchParams(resolved);
  return (
    <CollectionFilterSidebarClient
      filters={data.transformedFilters.filters}
      priceRange={data.transformedFilters.priceRange}
      activeFilters={activeFilters}
    />
  );
}
