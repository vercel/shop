import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ProductsGridSkeleton } from "@/components/product/products-grid";
import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { Filter, PriceRange } from "@/lib/filters/types";

import { CollectionActiveFilterCountBadge } from "./collection-browse-provider";
import { FilterPendingScope } from "./filter-pending-context";
import { FilterSidebarSheet } from "./filter-sidebar-sheet";
import { CollectionFilters } from "./filters";
import { CollectionsSortSelect } from "./sort-select";

interface BrowseToolbarProps {
  facetsPromise: Promise<{ filters: Filter[]; priceRange?: PriceRange }>;
  filtersLabel?: string;
  resultCount?: ReactNode;
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
  resultCount?: ReactNode;
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
        sortSelect={
          <div className="flex h-9 w-fit items-center justify-between gap-2 rounded-md bg-transparent px-0 py-2 text-sm whitespace-nowrap">
            <span>{sortByLabel ?? t("sortBy")}</span>
            <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
          </div>
        }
      />
      <ProductsGridSkeleton
        count={PRODUCTS_PER_PAGE}
        className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />
    </>
  );
}

interface ToolbarLayoutProps {
  filterSheet: ReactNode;
  resultCount?: ReactNode;
  sortSelect: ReactNode;
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
