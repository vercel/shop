import { Suspense } from "react";

import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import type { CollectionResultsData } from "@/lib/collections/server";

function Fallback() {
  return <CollectionFilterSidebarSkeleton />;
}

async function Render({
  collectionResultsDataPromise,
}: {
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const { activeFilters, transformedFilters } = await collectionResultsDataPromise;

  return (
    <CollectionFilterSidebarClient
      filters={transformedFilters.filters}
      priceRange={transformedFilters.priceRange}
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
