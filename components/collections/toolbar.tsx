import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { SortValue } from "@/lib/collections/types";
import type { Facets } from "@/lib/filters/types";

import {
  BrowseDensityToggle,
  CollectionActiveFilterCountBadge,
} from "./collection-browse-provider";
import { CollectionFilters } from "./filters";
import { FilterSheet } from "./filters-client";
import { CollectionsSortSelect } from "./sort-select";

const FILTER_TRIGGER_CLASS = "flex cursor-pointer items-center gap-2 text-sm font-medium lg:hidden";

interface BrowseToolbarProps {
  facetsPromise: Promise<Facets>;
  resultCount?: ReactNode;
  sortExclude?: SortValue[];
}

export function BrowseToolbar({ facetsPromise, resultCount, sortExclude }: BrowseToolbarProps) {
  return (
    <ToolbarLayout
      densityToggle={<BrowseDensityToggle />}
      filterSheet={
        <FilterSheet
          label="Filters"
          trigger={
            <button type="button" className={FILTER_TRIGGER_CLASS}>
              <SlidersHorizontalIcon className="size-4" />
              <span>Filters</span>
              <CollectionActiveFilterCountBadge />
            </button>
          }
        >
          <CollectionFilters facetsPromise={facetsPromise} />
        </FilterSheet>
      }
      resultCount={resultCount}
      sortSelect={<CollectionsSortSelect exclude={sortExclude} />}
    />
  );
}

interface BrowseToolbarFallbackProps {
  resultCount?: ReactNode;
}

export function BrowseToolbarFallback({ resultCount }: BrowseToolbarFallbackProps) {
  return (
    <ToolbarLayout
      filterSheet={
        <button type="button" className={FILTER_TRIGGER_CLASS}>
          <SlidersHorizontalIcon className="size-4" />
          <span>Filters</span>
        </button>
      }
      resultCount={resultCount}
      sortSelect={
        <div className="flex h-9 w-fit items-center justify-between gap-2 rounded-md bg-transparent px-0 py-2 text-sm whitespace-nowrap">
          <span>Sort</span>
          <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
        </div>
      }
    />
  );
}

interface ToolbarLayoutProps {
  densityToggle?: ReactNode;
  filterSheet: ReactNode;
  resultCount?: ReactNode;
  sortSelect: ReactNode;
}

function ToolbarLayout({
  densityToggle,
  filterSheet,
  resultCount,
  sortSelect,
}: ToolbarLayoutProps) {
  return (
    <div className="flex items-center gap-5">
      {filterSheet}
      <div className="ml-auto flex items-center gap-5">
        {resultCount !== undefined && (
          <div className="hidden items-center text-sm text-muted-foreground sm:flex">
            {resultCount}
          </div>
        )}
        {densityToggle}
        {sortSelect}
      </div>
    </div>
  );
}
