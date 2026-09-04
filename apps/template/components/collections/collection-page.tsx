import { SlidersHorizontalIcon } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CollectionViewedTracker } from "@/components/analytics/trackers";
import { CollectionHero } from "@/components/collections/collection-hero";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionFilters } from "@/components/collections/filters";
import { CollectionResultsGrid } from "@/components/collections/results-grid";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { SortSelectFallback } from "@/components/collections/sort-select-fallback";
import { CollectionToolbar } from "@/components/collections/toolbar";
import { ProductsGridSkeleton } from "@/components/product/products-grid";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { CollectionSchema } from "@/components/schema/collection-schema";
import { Container } from "@/components/ui/container";
import Link from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import type { CollectionResultsData, CollectionSearchState } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";
import type { Collection } from "@/lib/types";

import {
  CollectionActiveFilterCountBadge,
  CollectionBrowseProvider,
} from "./collection-browse-provider";
import { FilterPendingScope } from "./filter-pending-context";

export async function CollectionDetailPage({
  collection,
  getCollectionResultsData,
  handle,
  locale,
  searchStatePromise,
  sortExclude,
}: {
  collection: Collection;
  // Called inside the browse Suspense boundary. The results fetch is uncached, so starting it
  // any higher would postpone the header along with the grid in a runtime prefetch.
  getCollectionResultsData: () => Promise<CollectionResultsData>;
  handle: string;
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
  sortExclude?: string[];
}) {
  const [messages, tSearch, tBreadcrumb] = await Promise.all([
    getMessages(),
    getTranslations("search"),
    getTranslations("collections.breadcrumb"),
  ]);
  const filtersLabel = tSearch("filters");
  const sortByLabel = tSearch("sortBy");

  return (
    <>
      {collection.id ? (
        <CollectionViewedTracker collection={{ handle: collection.handle, id: collection.id }} />
      ) : null}
      <Page className={collection.image ? "pt-0" : "pt-2.5 md:pt-10"}>
        <Sections className="gap-5">
          <CollectionHeader
            collection={collection}
            handle={handle}
            homeLabel={tBreadcrumb("home")}
          />

          <Container>
            <Suspense
              fallback={
                <CollectionBrowseFallback filtersLabel={filtersLabel} sortByLabel={sortByLabel} />
              }
            >
              <CollectionBrowse
                filtersLabel={filtersLabel}
                getCollectionResultsData={getCollectionResultsData}
                handle={handle}
                locale={locale}
                messages={{ category: messages.category, search: messages.search }}
                searchStatePromise={searchStatePromise}
                sortExclude={sortExclude}
              />
            </Suspense>
          </Container>
        </Sections>
      </Page>
    </>
  );
}

function CollectionBrowse({
  filtersLabel,
  getCollectionResultsData,
  handle,
  locale,
  messages,
  searchStatePromise,
  sortExclude,
}: {
  filtersLabel: string;
  getCollectionResultsData: () => Promise<CollectionResultsData>;
  handle: string;
  locale: Locale;
  messages: Pick<Awaited<ReturnType<typeof getMessages>>, "category" | "search">;
  searchStatePromise: Promise<CollectionSearchState>;
  sortExclude?: string[];
}) {
  const collectionResultsDataPromise = getCollectionResultsData();

  return (
    <NextIntlClientProvider messages={messages}>
      <CollectionBrowseProvider handle={handle} searchStatePromise={searchStatePromise}>
        <CollectionToolbar
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
                  facetsPromise={collectionResultsDataPromise.then(
                    (data) => data.transformedFilters,
                  )}
                />
              </FilterPendingScope>
            </FilterSidebarSheet>
          }
          sortSelect={<CollectionsSortSelect exclude={sortExclude} />}
        />

        <FilterPendingScope>
          <CollectionResultsGrid
            locale={locale}
            collectionResultsDataPromise={collectionResultsDataPromise}
          />
        </FilterPendingScope>
      </CollectionBrowseProvider>
    </NextIntlClientProvider>
  );
}

// Shell fallback for a collection route while `params`/`searchParams` resolve on navigation.
// Uses the text-header layout (the hero variant needs the collection image, which is URL data);
// collections with a hero shift once when the real header lands.
export function CollectionDetailSkeleton({
  filtersLabel,
  sortByLabel,
}: {
  filtersLabel: string;
  sortByLabel: string;
}) {
  return (
    <Page className="pt-2.5 md:pt-10">
      <Sections className="gap-5">
        <Container>
          <div aria-busy="true" className="grid gap-2.5">
            <Skeleton className="h-9 w-64 sm:h-10 md:h-12 md:w-80" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        </Container>
        <Container>
          <CollectionBrowseFallback filtersLabel={filtersLabel} sortByLabel={sortByLabel} />
        </Container>
      </Sections>
    </Page>
  );
}

function CollectionBrowseFallback({
  filtersLabel,
  sortByLabel,
}: {
  filtersLabel: string;
  sortByLabel: string;
}) {
  return (
    <>
      <CollectionToolbar
        filterSheet={
          <button type="button" className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontalIcon className="size-4" />
            <span>{filtersLabel}</span>
          </button>
        }
        sortSelect={<SortSelectFallback label={sortByLabel} />}
      />
      <ProductsGridSkeleton count={40} className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
    </>
  );
}

function CollectionHeader({
  collection,
  handle,
  homeLabel,
}: {
  collection: Collection;
  handle: string;
  homeLabel: string;
}) {
  const { description, image, title, updatedAt } = collection;

  const breadcrumbItems = [
    { name: homeLabel, path: "/" },
    { name: title, path: `/collections/${handle}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionSchema collection={{ handle, title, description, updatedAt }} />
      {image ? (
        <CollectionHero image={image} title={title} />
      ) : (
        <Container>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl">
              <Link href={`/collections/${handle}`}>{title}</Link>
            </h1>
            {description && <p className="mt-1 leading-6 text-muted-foreground">{description}</p>}
          </div>
        </Container>
      )}
    </>
  );
}
