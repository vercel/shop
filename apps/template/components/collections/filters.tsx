import { Suspense } from "react";

import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Filter, PriceRange } from "@/lib/types";

function CollectionFilterSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[0, 1, 2].map((section) => (
        <div key={section} className="space-y-2.5">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((option) => (
              <Skeleton key={option} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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
