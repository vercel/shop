import { SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { ProductCardSkeleton } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CollectionResultsData } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";

import { FilterPendingScope } from "./filter-pending-context";
import { CollectionFilters } from "./filters";
import { CollectionResultsGrid } from "./results-grid";
import { CollectionToolbar, CollectionToolbarSkeleton } from "./toolbar";

const FALLBACK_SKELETON_KEYS = Array.from(
  { length: 15 },
  (_, index) => `collection-section-skeleton-${index}`,
);

function Fallback() {
  return (
    <>
      <CollectionToolbarSkeleton />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {FALLBACK_SKELETON_KEYS.map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
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
      <CollectionToolbar
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

      <FilterPendingScope>
        <CollectionResultsGrid
          locale={locale}
          collectionResultsDataPromise={collectionResultsDataPromise}
        />
      </FilterPendingScope>
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
