import { Suspense } from "react";

import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import type { Filter, PriceRange } from "@/lib/types";

async function Render({
  facetsPromise,
}: {
  facetsPromise: Promise<{ filters: Filter[]; priceRange?: PriceRange }>;
}) {
  const { filters, priceRange } = await facetsPromise;
  return <CollectionFilterSidebarClient filters={filters} priceRange={priceRange} />;
}

export function CollectionFilters({
  facetsPromise,
}: {
  facetsPromise: Promise<{ filters: Filter[]; priceRange?: PriceRange }>;
}) {
  return (
    <Suspense fallback={<CollectionFilterSidebarSkeleton />}>
      <Render facetsPromise={facetsPromise} />
    </Suspense>
  );
}
