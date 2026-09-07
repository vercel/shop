import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { SearchViewedTracker } from "@/components/analytics/trackers";
import { CollectionBrowseProvider } from "@/components/collections/collection-browse-provider";
import { SEARCH_SORT_EXCLUDE } from "@/components/collections/sort-select";
import { BrowseFallback, BrowseToolbar } from "@/components/collections/toolbar";
import { SearchResultsGrid } from "@/components/search/results";
import { Container } from "@/components/ui/container";
import Link from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionSearchState } from "@/lib/collections/server";
import { getLocale } from "@/lib/params";
import { getSearchResultsData } from "@/lib/search/server";
import type { SearchResultsData } from "@/lib/search/types";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/[flags]/[locale]/search">): Promise<Metadata> {
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

export default async function SearchPage({ searchParams }: PageProps<"/[flags]/[locale]/search">) {
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
          <Suspense fallback={<BrowseFallback resultCount={<Skeleton className="h-4 w-20" />} />}>
            <NextIntlClientProvider
              messages={{ category: messages.category, search: messages.search }}
            >
              <SearchBrowse
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
  locale,
  searchParamsPromise,
  searchResultsDataPromise,
  searchStatePromise,
}: {
  locale: Awaited<ReturnType<typeof getLocale>>;
  searchParamsPromise: PageProps<"/[flags]/[locale]/search">["searchParams"];
  searchResultsDataPromise: Promise<SearchResultsData>;
  searchStatePromise: Promise<Awaited<ReturnType<typeof getCollectionSearchState>>>;
}) {
  const query = getParam(await searchParamsPromise, "q") ?? "";

  // A new term rebuilds the browse store so stale filters never carry across searches.
  return (
    <CollectionBrowseProvider handle={`search:${query}`} searchStatePromise={searchStatePromise}>
      <BrowseToolbar
        facetsPromise={searchResultsDataPromise.then((data) => data.transformedFilters)}
        resultCount={
          <Suspense fallback={<Skeleton className="h-4 w-20" />}>
            <SearchResultCount dataPromise={searchResultsDataPromise} />
          </Suspense>
        }
        sortExclude={SEARCH_SORT_EXCLUDE}
      />
      <SearchResultsGrid locale={locale} searchResultsDataPromise={searchResultsDataPromise} />
    </CollectionBrowseProvider>
  );
}

async function SearchAnalyticsTracker({
  searchParamsPromise,
}: {
  searchParamsPromise: PageProps<"/[flags]/[locale]/search">["searchParams"];
}) {
  const query = getParam(await searchParamsPromise, "q");
  return <SearchViewedTracker searchTerm={query ?? ""} />;
}

async function SearchQueryLabel({
  searchParamsPromise,
}: {
  searchParamsPromise: PageProps<"/[flags]/[locale]/search">["searchParams"];
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
