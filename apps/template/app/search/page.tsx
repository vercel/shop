import { ChevronLeftIcon, SlidersHorizontalIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import {
  FilterPendingScope,
  FilterTransitionProvider,
} from "@/components/collections/filter-pending-context";
import {
  MobileFilterSortBar,
  MobileFilterSortBarSkeleton,
} from "@/components/collections/mobile-filter-sort-bar";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { CollectionFilterSidebarClient } from "@/components/filters/collection-filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/filters/collection-filter-sidebar-skeleton";
import { FilterSidebarSheet } from "@/components/filters/filter-sidebar-sheet";
import { Container } from "@/components/layout/container";
import { Results, ResultsSkeleton } from "@/components/search/results";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { buildProductFiltersFromParams, getProducts } from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { parseFiltersFromSearchParams } from "@/lib/utils/filter-params";
import { RESULTS_PER_PAGE } from "@/lib/utils/product-card";

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

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const locale = await getLocale();

  return (
    <Container className="pt-3 md:pt-8">
      <FilterTransitionProvider>
        <Suspense fallback={<SearchHeaderSkeleton />}>
          <SearchHeader locale={locale} searchParamsPromise={searchParams} />
        </Suspense>

        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults searchParamsPromise={searchParams} />
        </Suspense>
      </FilterTransitionProvider>
    </Container>
  );
}

async function SearchHeader({
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

  const sort = resolvedSearchParams.sort as string | undefined;
  const cursor = resolvedSearchParams.cursor as string | undefined;
  const collection = resolvedSearchParams.collection as string | undefined;

  return (
    <>
      {/* Mobile: back breadcrumb + result count */}
      <div className="flex items-center justify-between mb-3 md:hidden">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeftIcon className="size-4" />
          <span>{t("breadcrumb.home")}</span>
        </Link>
        <Suspense fallback={<Skeleton className="h-4 w-24" />}>
          <SearchResultCount
            query={q}
            sort={sort}
            collection={collection}
            cursor={cursor}
            locale={locale}
            activeFilters={activeFilters}
          />
        </Suspense>
      </div>

      {/* Desktop: full breadcrumb */}
      <Breadcrumb className="mb-3 hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("breadcrumb.home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {q ? t("breadcrumb.searchQuery", { query: q }) : t("breadcrumb.search")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile: filter/sort bar (gray band between breadcrumb and title) */}
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

      {/* Title + desktop sort */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-4 md:mt-0 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {q ? t("titleQuery", { query: q }) : t("title")}
          </h1>
          {q && <p className="text-muted-foreground mt-1">{t("titleSubtext")}</p>}
        </div>
        <div className="hidden md:block">
          <CollectionsSortSelect />
        </div>
      </div>
    </>
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

async function SearchResultCount({
  query,
  sort,
  collection,
  cursor,
  locale,
  activeFilters,
}: {
  query?: string;
  sort?: string;
  collection?: string;
  cursor?: string;
  locale: Locale;
  activeFilters: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("search");
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const result = await getProducts({
    query,
    collection,
    sortKey: sort,
    limit: RESULTS_PER_PAGE,
    cursor,
    filters: shopifyFilters,
    locale,
  });

  if (result.products.length === 0) return null;

  return (
    <p className="text-sm text-muted-foreground">{t("resultCount", { count: result.total })}</p>
  );
}

function SearchHeaderSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24 md:w-48" />
        <Skeleton className="h-4 w-24 md:hidden" />
      </div>
      <MobileFilterSortBarSkeleton />
      <Skeleton className="mt-4 md:mt-0 mb-8 h-10 w-72" />
    </>
  );
}
