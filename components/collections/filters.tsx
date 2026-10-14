import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Facets } from "@/lib/filters/types";

import { CollectionFilterSidebar } from "./filters-client";

interface CollectionFiltersProps {
  facets: Facets | Promise<Facets>;
}

interface ResolvedCollectionFiltersProps {
  facets: Promise<Facets>;
}

export function CollectionFilters({ facets }: CollectionFiltersProps) {
  if (!(facets instanceof Promise)) {
    return <CollectionFilterSidebar filters={facets.filters} priceRange={facets.priceRange} />;
  }
  return (
    <Suspense fallback={<CollectionFiltersSkeleton />}>
      <ResolvedCollectionFilters facets={facets} />
    </Suspense>
  );
}

async function ResolvedCollectionFilters({ facets }: ResolvedCollectionFiltersProps) {
  const { filters, priceRange } = await facets;
  return <CollectionFilterSidebar filters={filters} priceRange={priceRange} />;
}

export function CollectionFiltersSkeleton() {
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
