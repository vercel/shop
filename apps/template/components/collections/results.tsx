import { SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { SortSelectFallback } from "@/components/collections/sort-select-fallback";
import type { CollectionResultsData, CollectionSearchState } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";

import { FilterPendingScope } from "./filter-pending-context";
import { CollectionFilters } from "./filters";
import { CollectionResultsGrid } from "./results-grid";
import { CollectionToolbar } from "./toolbar";

export async function CollectionResultsSection({
  locale,
  searchStatePromise,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const tSearch = await getTranslations("search");
  const filtersLabel = tSearch("filters");

  return (
    <>
      <CollectionToolbar
        filterSheet={
          <FilterSidebarSheet
            label={filtersLabel}
            trigger={
              <button type="button" className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontalIcon className="size-4" />
                <span>{filtersLabel}</span>
                <Suspense fallback={null}>
                  <CollectionFilterCountBadge searchStatePromise={searchStatePromise} />
                </Suspense>
              </button>
            }
          >
            <FilterPendingScope>
              <CollectionFilters collectionResultsDataPromise={collectionResultsDataPromise} />
            </FilterPendingScope>
          </FilterSidebarSheet>
        }
        sortSelect={
          <Suspense fallback={<SortSelectFallback label={tSearch("sortBy")} />}>
            <CollectionsSortSelect />
          </Suspense>
        }
      />

      <FilterPendingScope>
        <CollectionResultsGrid
          locale={locale}
          collectionResultsDataPromise={collectionResultsDataPromise}
        />
      </FilterPendingScope>
    </>
  );
}

async function CollectionFilterCountBadge({
  searchStatePromise,
}: {
  searchStatePromise: Promise<CollectionSearchState>;
}) {
  const { activeFilters } = await searchStatePromise;
  const activeCount = Object.values(activeFilters).reduce((count, v) => {
    if (!v) return count;
    return count + (Array.isArray(v) ? v.length : 1);
  }, 0);
  if (activeCount === 0) return null;
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
      {activeCount}
    </span>
  );
}
