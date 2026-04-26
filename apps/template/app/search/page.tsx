import { SlidersHorizontalIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  FilterPendingScope,
  FilterTransitionProvider,
} from "@/components/collections/filter-pending-context";
import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { buildSortOptions } from "@/components/collections/sort-options";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { CollectionToolbar, CollectionToolbarSkeleton } from "@/components/collections/toolbar";
import {
  type SearchResultsData,
  ResultsSkeleton,
  SearchResultsGrid,
  getSearchResultsData,
} from "@/components/search/results";
import { Container } from "@/components/ui/container";
import { Sections } from "@/components/ui/sections";
import { type Locale, formatPlural } from "@/lib/i18n";
import { t, tNamespace } from "@/lib/i18n/server";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { parseFiltersFromSearchParams } from "@/lib/utils";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const q = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams.q;
  const query = q ?? "";
  const hasQuery = query.length > 0;
  const [title, description] = await Promise.all([
    hasQuery ? t("seo.searchTitleQuery", { query }) : t("seo.searchTitle"),
    hasQuery ? t("seo.searchDescriptionQuery", { query }) : t("seo.searchDescription"),
  ]);

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
    },
  ],
};

export const unstable_prefetch = "force-runtime";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const [locale, title] = await Promise.all([getLocale(), t("search.title")]);

  return (
    <Container className="pt-2.5 md:pt-10 pb-10">
      <FilterTransitionProvider>
        <Sections className="gap-5">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              <Link href="/search">{title}</Link>
              <Suspense fallback={null}>
                <SearchQueryLabel searchParamsPromise={searchParams} />
              </Suspense>
            </h1>
          </div>
          <Suspense fallback={<ResultsSkeleton />}>
            <SearchContent locale={locale} searchParamsPromise={searchParams} />
          </Suspense>
        </Sections>
      </FilterTransitionProvider>
    </Container>
  );
}

async function SearchQueryLabel({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParamsPromise;
  const raw = resolvedSearchParams.q;
  const query = Array.isArray(raw) ? raw[0] : raw;
  if (!query) return null;
  return await t("search.forQuery", { query });
}

async function SearchContent({
  locale,
  searchParamsPromise,
}: {
  locale: Locale;
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolvedSearchParams, searchLabels] = await Promise.all([
    searchParamsPromise,
    tNamespace("search"),
  ]);
  const { sort, collection } = resolvedSearchParams;
  const q = resolvedSearchParams.q as string | undefined;
  const activeFilters = parseFiltersFromSearchParams(resolvedSearchParams);

  const searchResultsDataPromise = getSearchResultsData({
    query: q,
    sort: sort as string | undefined,
    collection: collection as string | undefined,
    locale,
    activeFilters,
  });

  return (
    <>
      <Suspense fallback={<CollectionToolbarSkeleton />}>
        <SearchToolbar
          locale={locale}
          searchResultsDataPromise={searchResultsDataPromise}
          filtersLabel={searchLabels.filters}
          resetLabel={searchLabels.reset}
          sortByLabel={searchLabels.sortBy}
        />
      </Suspense>

      <SearchResultsGrid locale={locale} searchResultsDataPromise={searchResultsDataPromise} />
    </>
  );
}

async function SearchToolbar({
  locale,
  searchResultsDataPromise,
  filtersLabel,
  resetLabel,
  sortByLabel,
}: {
  locale: Locale;
  searchResultsDataPromise: Promise<SearchResultsData>;
  filtersLabel: string;
  resetLabel: string;
  sortByLabel: string;
}) {
  const [data, searchLabels, categoryLabels] = await Promise.all([
    searchResultsDataPromise,
    tNamespace("search"),
    tNamespace("category"),
  ]);

  const activeFilterCount = Object.values(data.activeFilters).reduce((count, v) => {
    if (!v) return count;
    return count + (Array.isArray(v) ? v.length : 1);
  }, 0);

  const sortOptions = buildSortOptions(searchLabels, [
    "product-name-ascending",
    "product-name-descending",
    "best-selling",
    "date-old-to-new",
    "date-new-to-old",
  ]);

  return (
    <CollectionToolbar
      resultCount={
        data.total > 0 ? formatPlural(searchLabels.resultCount, data.total, locale) : undefined
      }
      filterSheet={
        <FilterSidebarSheet
          label={filtersLabel}
          activeCount={activeFilterCount}
          trigger={
            <button type="button" className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontalIcon className="size-4" />
              <span>{filtersLabel}</span>
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                  {activeFilterCount}
                </span>
              )}
            </button>
          }
        >
          <FilterPendingScope>
            <CollectionFilterSidebarClient
              filters={data.transformedFilters.filters}
              filtersLabel={filtersLabel}
              priceLabel={categoryLabels.price}
              priceRange={data.transformedFilters.priceRange}
              resetLabel={resetLabel}
              activeFilters={data.activeFilters}
            />
          </FilterPendingScope>
        </FilterSidebarSheet>
      }
      sortSelect={<CollectionsSortSelect options={sortOptions} sortByLabel={sortByLabel} />}
    />
  );
}
