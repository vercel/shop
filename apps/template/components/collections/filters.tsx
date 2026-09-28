import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Facets } from "@/lib/filters/types";

import { CollectionFilterSidebar } from "./filters-client";

interface CollectionFiltersProps {
  facetsPromise: Promise<Facets>;
}

export function CollectionFilters({ facetsPromise }: CollectionFiltersProps) {
  return (
    <Suspense fallback={<CollectionFiltersSkeleton />}>
      <ResolvedCollectionFilters facetsPromise={facetsPromise} />
    </Suspense>
  );
}

async function ResolvedCollectionFilters({ facetsPromise }: CollectionFiltersProps) {
  const { filters, priceRange } = await facetsPromise;
  return <CollectionFilterSidebar filters={filters} priceRange={priceRange} />;
}

function CollectionFiltersSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      {[0, 1, 2].map((section) => (
        <div key={section} className="grid gap-2.5">
          <Skeleton className="h-5 w-24" />
          {[0, 1, 2, 3].map((option) => (
            <Skeleton key={option} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
