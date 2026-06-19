import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { SearchView, SearchViewFallback } from "@/components/storefront/search-view";
import { getLocale } from "@/lib/params";
import { getSearchResultsData } from "@/lib/search/server";
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

export const instant = true;

export const prefetch = "allow-runtime";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const locale = await getLocale();

  // Don't await searchParams here — it would force the route fully dynamic.
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

  return (
    <Suspense fallback={<SearchViewFallback locale={locale} />}>
      <SearchView locale={locale} searchResultsDataPromise={searchResultsDataPromise} />
    </Suspense>
  );
}
