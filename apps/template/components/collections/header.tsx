import { SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  MobileFilterSortBar,
  MobileFilterSortBarSkeleton,
} from "@/components/collections/mobile-filter-sort-bar";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import type { Locale } from "@/lib/i18n";

import type { CollectionResultsData } from "@/lib/collections/server";
import { FilterPendingScope } from "./filter-pending-context";
import { CollectionFilters } from "./filters";
import { CollectionsSortSelect } from "./sort-select";

function Fallback() {
  return <MobileFilterSortBarSkeleton />;
}

async function Render({
  handlePromise,
  locale,
  collectionResultsDataPromise,
}: {
  handlePromise: Promise<string>;
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const [, tSearch] = await Promise.all([
    handlePromise,
    getTranslations("search"),
  ]);

  return (
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
  );
}

export function CollectionHeader({
  handlePromise,
  locale,
  collectionResultsDataPromise,
}: {
  handlePromise: Promise<string>;
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render
        handlePromise={handlePromise}
        locale={locale}
        collectionResultsDataPromise={collectionResultsDataPromise}
      />
    </Suspense>
  );
}
