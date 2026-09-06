import { SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type * as React from "react";

import { ProductsGridSkeleton } from "@/components/product/products-grid";
import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { Filter, PriceRange } from "@/lib/types";

import { CollectionActiveFilterCountBadge } from "./collection-browse-provider";
import { FilterPendingScope } from "./filter-pending-context";
import { FilterSidebarSheet } from "./filter-sidebar-sheet";
import { CollectionFilters } from "./filters";
import { CollectionsSortSelect } from "./sort-select";
import { SortSelectFallback } from "./sort-select-fallback";

interface BrowseToolbarProps {
  facetsPromise: Promise<{ filters: Filter[]; priceRange?: PriceRange }>;
  filtersLabel?: string;
  resultCount?: React.ReactNode;
  sortExclude?: string[];
}

export async function BrowseToolbar({
  facetsPromise,
  filtersLabel,
  resultCount,
  sortExclude,
}: BrowseToolbarProps) {
  const t = await getTranslations("search");
  const label = filtersLabel ?? t("filters");
  return (
    <CollectionToolbar
      filterSheet={
        <FilterSidebarSheet
          label={label}
          trigger={
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 text-sm font-medium"
            >
              <SlidersHorizontalIcon className="size-4" />
              <span>{label}</span>
              <CollectionActiveFilterCountBadge />
            </button>
          }
        >
          <FilterPendingScope>
            <CollectionFilters facetsPromise={facetsPromise} />
          </FilterPendingScope>
        </FilterSidebarSheet>
      }
      resultCount={resultCount}
      sortSelect={<CollectionsSortSelect exclude={sortExclude} />}
    />
  );
}

interface BrowseFallbackProps {
  filtersLabel?: string;
  sortByLabel?: string;
  resultCount?: React.ReactNode;
}

export async function BrowseFallback({
  filtersLabel,
  resultCount,
  sortByLabel,
}: BrowseFallbackProps) {
  const t = await getTranslations("search");
  return (
    <>
      <CollectionToolbar
        filterSheet={
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 text-sm font-medium"
          >
            <SlidersHorizontalIcon className="size-4" />
            <span>{filtersLabel ?? t("filters")}</span>
          </button>
        }
        resultCount={resultCount}
        sortSelect={<SortSelectFallback label={sortByLabel ?? t("sortBy")} />}
      />
      <ProductsGridSkeleton
        count={PRODUCTS_PER_PAGE}
        className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />
    </>
  );
}

interface ToolbarLayoutProps {
  filterSheet: React.ReactNode;
  resultCount?: React.ReactNode;
  sortSelect: React.ReactNode;
}

export function CollectionToolbar({ filterSheet, resultCount, sortSelect }: ToolbarLayoutProps) {
  return (
    <div className="flex items-center gap-5">
      {filterSheet}
      <div className="ml-auto flex items-center gap-5">
        {resultCount !== undefined && (
          <div className="hidden items-center text-sm text-muted-foreground sm:flex">
            {resultCount}
          </div>
        )}
        {sortSelect}
      </div>
    </div>
  );
}
