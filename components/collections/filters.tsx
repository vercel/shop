import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Facets } from "@/lib/filters/types";

import { CollectionFilterSidebar } from "./filters-client";

interface CollectionFiltersProps {
  className?: string;
  facetsPromise: Promise<Facets>;
}

export function CollectionFilters({ className, facetsPromise }: CollectionFiltersProps) {
  return (
    <Suspense
      fallback={
        <div className={className}>
          <CollectionFiltersSkeleton />
        </div>
      }
    >
      <ResolvedCollectionFilters className={className} facetsPromise={facetsPromise} />
    </Suspense>
  );
}

// Merchants without Search & Discovery facets get no sidebar at all rather than an empty column.
async function ResolvedCollectionFilters({ className, facetsPromise }: CollectionFiltersProps) {
  const { filters, priceRange } = await facetsPromise;
  if (filters.length === 0 && !priceRange) return null;
  return (
    <div className={className}>
      <CollectionFilterSidebar filters={filters} priceRange={priceRange} />
    </div>
  );
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
