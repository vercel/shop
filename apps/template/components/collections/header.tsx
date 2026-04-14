import { SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  MobileFilterSortBar,
  MobileFilterSortBarSkeleton,
} from "@/components/collections/mobile-filter-sort-bar";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import type { getCollection } from "@/lib/shopify/operations/collections";

import type { CollectionResultsData } from "./data";
import { FilterPendingScope } from "./filter-pending-context";
import { CollectionFilters } from "./filters";
import { CollectionsSortSelect } from "./sort-select";

function Fallback() {
  return (
    <>
      <MobileFilterSortBarSkeleton />
      <Skeleton className="mt-4 mb-8 h-10 w-72 md:mt-0" />
    </>
  );
}

async function Render({
  handlePromise,
  locale,
  collectionPromise,
  collectionResultsDataPromise,
}: {
  handlePromise: Promise<string>;
  locale: Locale;
  collectionPromise: Promise<Awaited<ReturnType<typeof getCollection>>>;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const [, collection, tSearch] = await Promise.all([
    handlePromise,
    collectionPromise,
    getTranslations("search"),
  ]);

  if (!collection) {
    notFound();
  }

  const { title, description } = collection;

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

      <div className="mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between md:mt-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        <div className="hidden md:block">
          <CollectionsSortSelect />
        </div>
      </div>
    </>
  );
}

export function CollectionHeader({
  handlePromise,
  locale,
  collectionPromise,
  collectionResultsDataPromise,
}: {
  handlePromise: Promise<string>;
  locale: Locale;
  collectionPromise: Promise<Awaited<ReturnType<typeof getCollection>>>;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render
        handlePromise={handlePromise}
        locale={locale}
        collectionPromise={collectionPromise}
        collectionResultsDataPromise={collectionResultsDataPromise}
      />
    </Suspense>
  );
}
