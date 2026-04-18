import { SlidersHorizontalIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  FilterPendingScope,
  FilterTransitionProvider,
} from "@/components/collections/filter-pending-context";
import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { CollectionToolbar, CollectionToolbarSkeleton } from "@/components/collections/toolbar";
import { Container } from "@/components/layout/container";
import {
  type SearchResultsData,
  ResultsSkeleton,
  SearchResultsGrid,
  getSearchResultsData,
} from "@/components/search/results";
import type { Locale } from "@/lib/i18n";
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
  prefetch: "runtime",
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

export const unstable_prefetch = "runtime";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("search")]);

  return (
    <Container className="pt-3 md:pt-8">
      <FilterTransitionProvider>
        <Suspense fallback={<ResultsSkeleton title={t("title")} />}>
          <SearchContent
            locale={locale}
            searchParamsPromise={searchParams}
            defaultTitle={t("title")}
          />
        </Suspense>
      </FilterTransitionProvider>
    </Container>
  );
}

async function SearchContent({
  locale,
  searchParamsPromise,
  defaultTitle,
}: {
  locale: Locale;
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
  defaultTitle: string;
}) {
  const [resolvedSearchParams, t] = await Promise.all([
    searchParamsPromise,
    getTranslations("search"),
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
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          {q ? t("titleQuery", { query: q }) : defaultTitle}
        </h1>
        {q && <p className="text-muted-foreground mt-1">{t("titleSubtext")}</p>}
      </div>

      <Suspense fallback={<CollectionToolbarSkeleton />}>
        <SearchToolbar
          locale={locale}
          searchResultsDataPromise={searchResultsDataPromise}
          filtersLabel={t("filters")}
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
}: {
  locale: Locale;
  searchResultsDataPromise: Promise<SearchResultsData>;
  filtersLabel: string;
}) {
  const [data, t] = await Promise.all([searchResultsDataPromise, getTranslations("search")]);

  const activeFilterCount = Object.values(data.activeFilters).reduce((count, v) => {
    if (!v) return count;
    return count + (Array.isArray(v) ? v.length : 1);
  }, 0);

  return (
    <CollectionToolbar
      resultCount={data.total > 0 ? t("resultCount", { count: data.total }) : undefined}
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
              priceRange={data.transformedFilters.priceRange}
              activeFilters={data.activeFilters}
            />
          </FilterPendingScope>
        </FilterSidebarSheet>
      }
      sortSelect={<CollectionsSortSelect />}
    />
  );
}
