import { Suspense } from "react";

import { CollectionFilterSidebarClient } from "@/components/filters/collection-filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/filters/collection-filter-sidebar-skeleton";

import type { CollectionResultsData } from "./data";

function Fallback() {
  return <CollectionFilterSidebarSkeleton />;
}

async function Render({
  collectionResultsDataPromise,
}: {
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const { activeFilters, filters, priceRange } = await collectionResultsDataPromise;

  return (
    <CollectionFilterSidebarClient
      filters={filters}
      priceRange={priceRange}
      activeFilters={activeFilters}
    />
  );
}

export function CollectionFilters({
  collectionResultsDataPromise,
}: {
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render collectionResultsDataPromise={collectionResultsDataPromise} />
    </Suspense>
  );
}
