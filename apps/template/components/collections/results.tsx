import { SlidersHorizontalIcon } from "lucide-react";
import { Suspense } from "react";

import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { ProductCardSkeleton } from "@/components/product-card/product-card";
import {
  type CollectionResultsData,
  getExactCollectionResultCount,
} from "@/lib/collections/server";
import { type Locale, formatPlural } from "@/lib/i18n";
import { tNamespace } from "@/lib/i18n/server";
import { getActiveFilterBadges } from "@/lib/shopify/transforms/filters";

import { FilterPendingScope } from "./filter-pending-context";
import { CollectionFilters } from "./filters";
import { CollectionResultsGrid } from "./results-grid";
import { buildSortOptions } from "./sort-options";
import { CollectionToolbar, CollectionToolbarSkeleton } from "./toolbar";

const FALLBACK_SKELETON_KEYS = Array.from(
  { length: 15 },
  (_, index) => `collection-section-skeleton-${index}`,
);

function Fallback() {
  return (
    <>
      <CollectionToolbarSkeleton />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {FALLBACK_SKELETON_KEYS.map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
      </div>
    </>
  );
}

function getActiveFilterCount(data: CollectionResultsData): number {
  const badges = getActiveFilterBadges(data.transformedFilters.filters, data.activeFilters);
  const hasPriceFilter =
    data.activeFilters["filter.v.price.gte"] !== undefined ||
    data.activeFilters["filter.v.price.lte"] !== undefined;
  return badges.length + (hasPriceFilter ? 1 : 0);
}

async function Render({
  locale,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const [data, searchLabels, categoryLabels] = await Promise.all([
    collectionResultsDataPromise,
    tNamespace("search"),
    tNamespace("category"),
  ]);

  const activeCount = getActiveFilterCount(data);
  const exactCount = getExactCollectionResultCount({ result: data.result });
  const filtersLabel = searchLabels.filters;
  const sortOptions = buildSortOptions(searchLabels);

  return (
    <>
      <CollectionToolbar
        resultCount={
          exactCount !== undefined && exactCount > 0
            ? formatPlural(searchLabels.resultCount, exactCount, locale)
            : undefined
        }
        filterSheet={
          <FilterSidebarSheet
            label={filtersLabel}
            activeCount={activeCount}
            trigger={
              <button type="button" className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontalIcon className="size-4" />
                <span>{filtersLabel}</span>
                {activeCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                    {activeCount}
                  </span>
                )}
              </button>
            }
          >
            <FilterPendingScope>
              <CollectionFilters
                collectionResultsDataPromise={collectionResultsDataPromise}
                filtersLabel={filtersLabel}
                priceLabel={categoryLabels.price}
                resetLabel={searchLabels.reset}
              />
            </FilterPendingScope>
          </FilterSidebarSheet>
        }
        sortSelect={
          <CollectionsSortSelect options={sortOptions} sortByLabel={searchLabels.sortBy} />
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
