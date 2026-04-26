import { Suspense } from "react";

import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import type { CollectionResultsData } from "@/lib/collections/server";

function Fallback() {
  return <CollectionFilterSidebarSkeleton />;
}

async function Render({
  collectionResultsDataPromise,
  filtersLabel,
  priceLabel,
  resetLabel,
}: {
  collectionResultsDataPromise: Promise<CollectionResultsData>;
  filtersLabel: string;
  priceLabel: string;
  resetLabel: string;
}) {
  const { activeFilters, transformedFilters } = await collectionResultsDataPromise;

  return (
    <CollectionFilterSidebarClient
      filters={transformedFilters.filters}
      filtersLabel={filtersLabel}
      priceLabel={priceLabel}
      priceRange={transformedFilters.priceRange}
      resetLabel={resetLabel}
      activeFilters={activeFilters}
    />
  );
}

export function CollectionFilters({
  collectionResultsDataPromise,
  filtersLabel,
  priceLabel,
  resetLabel,
}: {
  collectionResultsDataPromise: Promise<CollectionResultsData>;
  filtersLabel: string;
  priceLabel: string;
  resetLabel: string;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render
        collectionResultsDataPromise={collectionResultsDataPromise}
        filtersLabel={filtersLabel}
        priceLabel={priceLabel}
        resetLabel={resetLabel}
      />
    </Suspense>
  );
}
