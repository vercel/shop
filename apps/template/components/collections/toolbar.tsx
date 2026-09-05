import { SlidersHorizontalIcon } from "lucide-react";
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
  resultCount?: React.ReactNode;
  sortExclude?: string[];
}

export function BrowseToolbar({ facetsPromise, resultCount, sortExclude }: BrowseToolbarProps) {
  return (
    <ToolbarLayout
      filterSheet={
        <FilterSidebarSheet
          label="Filters"
          trigger={
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 text-sm font-medium"
            >
              <SlidersHorizontalIcon className="size-4" />
              <span>Filters</span>
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
  resultCount?: React.ReactNode;
}

export function BrowseFallback({ resultCount }: BrowseFallbackProps) {
  return (
    <>
      <ToolbarLayout
        filterSheet={
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 text-sm font-medium"
          >
            <SlidersHorizontalIcon className="size-4" />
            <span>Filters</span>
          </button>
        }
        resultCount={resultCount}
        sortSelect={<SortSelectFallback label="Sort" />}
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

function ToolbarLayout({ filterSheet, resultCount, sortSelect }: ToolbarLayoutProps) {
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
