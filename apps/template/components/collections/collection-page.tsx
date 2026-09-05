import { SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { CollectionViewedTracker } from "@/components/analytics/trackers";
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
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import type { CollectionResultsData, CollectionSearchState } from "@/lib/collections/server";
import type { Collection } from "@/lib/types";

import {
  CollectionActiveFilterCountBadge,
  CollectionBrowseProvider,
} from "./collection-browse-provider";
import { FilterPendingScope } from "./filter-pending-context";

export function CollectionDetailPage({
  collection,
  collectionResultsDataPromise,
  handle,
  searchStatePromise,
  sortExclude,
}: {
  collection: Collection;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
  handle: string;
  searchStatePromise: Promise<CollectionSearchState>;
  sortExclude?: string[];
}) {
  const filtersLabel = "Filters";
  const sortByLabel = "Sort";
  return (
    <>
      {collection.id ? (
        <CollectionViewedTracker collection={{ handle: collection.handle, id: collection.id }} />
      ) : null}
      <Page className="pt-2.5 md:pt-10">
        <Container>
          <Sections className="gap-5">
            <CollectionHeader collection={collection} handle={handle} homeLabel="Home" />

            <Suspense
              fallback={
                <CollectionBrowseFallback filtersLabel={filtersLabel} sortByLabel={sortByLabel} />
              }
            >
              <CollectionBrowseProvider handle={handle} searchStatePromise={searchStatePromise}>
                <CollectionToolbar
                  filterSheet={
                    <FilterSidebarSheet
                      label={filtersLabel}
                      trigger={
                        <button
                          type="button"
                          className="flex items-center gap-2 text-sm font-medium"
                        >
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
                    collectionResultsDataPromise={collectionResultsDataPromise}
                  />
                </FilterPendingScope>
              </CollectionBrowseProvider>
            </Suspense>
          </Sections>
        </Container>
      </Page>
    </>
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
  const { title, description, updatedAt } = collection;

  const breadcrumbItems = [
    { name: homeLabel, path: "/" },
    { name: title, path: `/collections/${handle}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionSchema collection={{ handle, title, description, updatedAt }} />
      <div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl">
          <Link href={`/collections/${handle}`}>{title}</Link>
        </h1>
        {description && <p className="mt-1 leading-6 text-muted-foreground">{description}</p>}
      </div>
    </>
  );
}
