import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SearchViewedTracker } from "@/components/analytics/trackers";
import { CollectionBrowseProvider } from "@/components/collections/collection-browse-provider";
import { SEARCH_SORT_EXCLUDE } from "@/components/collections/sort-select";
import { BrowseFallback, BrowseToolbar } from "@/components/collections/toolbar";
import { SearchResultsGrid } from "@/components/search/results";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionSearchState } from "@/lib/collections/server";
import { formatCount } from "@/lib/content";
import { getSearchResultsData, type SearchResultsData } from "@/lib/search/server";
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
          <Suspense fallback={<BrowseFallback resultCount={<Skeleton className="h-4 w-20" />} />}>
            <SearchBrowse
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
  searchParamsPromise,
  searchResultsDataPromise,
  searchStatePromise,
}: {
  searchParamsPromise: PageProps<"/search">["searchParams"];
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
      <SearchResultsGrid searchResultsDataPromise={searchResultsDataPromise} />
    </CollectionBrowseProvider>
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
