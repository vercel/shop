import { SlidersHorizontalIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  FilterPendingScope,
  FilterTransitionProvider,
} from "@/components/collections/filter-pending-context";
import {
  MobileFilterSortBar,
  MobileFilterSortBarSkeleton,
} from "@/components/collections/mobile-filter-sort-bar";
import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { Container } from "@/components/layout/container";
import { Results, ResultsSkeleton } from "@/components/search/results";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { buildProductFiltersFromParams, getProducts } from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { RESULTS_PER_PAGE, parseFiltersFromSearchParams } from "@/lib/utils";

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
        cursor: null,
        "filter.v.price.gte": null,
        "filter.v.price.lte": null,
      },
      cookies: [{ name: "shopify_cartId", value: null }],
    },
  ],
};

export const unstable_prefetch = "runtime";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const locale = await getLocale();

  return (
    <Container className="pt-3 md:pt-8">
      <FilterTransitionProvider>
        <Suspense fallback={<TitleSkeleton />}>
          <SearchTitle searchParamsPromise={searchParams} />
        </Suspense>

        <Suspense fallback={<MobileFilterSortBarSkeleton />}>
          <SearchMobileBar locale={locale} searchParamsPromise={searchParams} />
        </Suspense>

        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults searchParamsPromise={searchParams} />
        </Suspense>
      </FilterTransitionProvider>
    </Container>
  );
}

async function SearchTitle({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolvedSearchParams, t] = await Promise.all([
    searchParamsPromise,
    getTranslations("search"),
  ]);
  const q = resolvedSearchParams.q as string | undefined;

  return (
    <div className="mt-4 md:mt-0 mb-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
        {q ? t("titleQuery", { query: q }) : t("title")}
      </h1>
      {q && <p className="text-muted-foreground mt-1">{t("titleSubtext")}</p>}
    </div>
  );
}

async function SearchMobileBar({
  locale,
  searchParamsPromise,
}: {
  locale: Locale;
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolvedSearchParams, t] = await Promise.all([
    searchParamsPromise,
    getTranslations("search"),
  ]);
  const q = resolvedSearchParams.q as string | undefined;
  const activeFilters = parseFiltersFromSearchParams(resolvedSearchParams);

  return (
    <MobileFilterSortBar
      filterSheet={
        <FilterSidebarSheet
          label={t("filters")}
          trigger={
            <button type="button" className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontalIcon className="size-4" />
              <span>{t("filters")}</span>
            </button>
          }
        >
          <Suspense fallback={<CollectionFilterSidebarSkeleton />}>
            <FilterPendingScope>
              <SearchFilterContent
                query={q}
                collection={resolvedSearchParams.collection as string | undefined}
                locale={locale}
                activeFilters={activeFilters}
              />
            </FilterPendingScope>
          </Suspense>
        </FilterSidebarSheet>
      }
      sortSelect={<CollectionsSortSelect />}
    />
  );
}

async function SearchResults({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, resolvedSearchParams] = await Promise.all([getLocale(), searchParamsPromise]);
  const { q, sort, collection, cursor } = resolvedSearchParams;
  const activeFilters = parseFiltersFromSearchParams(resolvedSearchParams);

  return (
    <Results
      query={q as string | undefined}
      sort={sort as string | undefined}
      collection={collection as string | undefined}
      locale={locale}
      cursor={cursor as string | undefined}
      activeFilters={activeFilters}
    />
  );
}

async function SearchFilterContent({
  query,
  collection,
  locale,
  activeFilters,
}: {
  query?: string;
  collection?: string;
  locale: Locale;
  activeFilters: Record<string, string | string[] | undefined>;
}) {
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const result = await getProducts({
    query,
    collection,
    limit: RESULTS_PER_PAGE,
    filters: shopifyFilters,
    locale,
  });

  const transformedFilters = transformShopifyFilters(result.filters, {
    activeFilters,
  });

  return (
    <CollectionFilterSidebarClient
      filters={transformedFilters.filters}
      priceRange={transformedFilters.priceRange}
      activeFilters={activeFilters}
    />
  );
}

function TitleSkeleton() {
  return (
    <div className="mt-4 md:mt-0 mb-6">
      <Skeleton className="h-10 sm:h-11 md:h-13 w-72" />
    </div>
  );
}
