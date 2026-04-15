import { SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  MobileFilterSortBar,
  MobileFilterSortBarSkeleton,
} from "@/components/collections/mobile-filter-sort-bar";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { ProductCardSkeleton } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";

import type { CollectionResultsData } from "@/lib/collections/server";
import { FilterPendingScope } from "./filter-pending-context";
import { CollectionFilters } from "./filters";
import { CollectionResultsGrid } from "./results-grid";

const FALLBACK_SKELETON_KEYS = Array.from(
  { length: 12 },
  (_, index) => `collection-section-skeleton-${index}`,
);

function Fallback() {
  return (
    <>
      <MobileFilterSortBarSkeleton />
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-64 shrink-0">
          <CollectionFilterSidebarSkeleton />
        </aside>
        <div className="flex-1">
          <div className="mb-6 hidden md:flex md:items-center md:justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {FALLBACK_SKELETON_KEYS.map((key) => (
              <ProductCardSkeleton key={key} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

async function Render({
  locale,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const tSearch = await getTranslations("search");

  return (
    <>
      <MobileFilterSortBar
        filterSheet={
          <FilterSidebarSheet
            label={tSearch("filters")}
            trigger={
              <button type="button" className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontalIcon className="size-4" />
                <span>{tSearch("filters")}</span>
              </button>
            }
          >
            <FilterPendingScope>
              <CollectionFilters collectionResultsDataPromise={collectionResultsDataPromise} />
            </FilterPendingScope>
          </FilterSidebarSheet>
        }
        sortSelect={<CollectionsSortSelect />}
      />

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-64 shrink-0">
          <FilterPendingScope>
            <CollectionFilters collectionResultsDataPromise={collectionResultsDataPromise} />
          </FilterPendingScope>
        </aside>

        <div className="flex-1">
          <FilterPendingScope>
            <CollectionResultsGrid
              locale={locale}
              collectionResultsDataPromise={collectionResultsDataPromise}
            />
          </FilterPendingScope>
        </div>
      </div>
    </>
  );
}

export function CollectionResultsSection({
  locale,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render locale={locale} collectionResultsDataPromise={collectionResultsDataPromise} />
    </Suspense>
  );
}
