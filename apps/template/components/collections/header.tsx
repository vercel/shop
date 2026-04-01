import { ChevronLeftIcon, SlidersHorizontalIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";

import {
  MobileFilterSortBar,
  MobileFilterSortBarSkeleton,
} from "@/components/collections/mobile-filter-sort-bar";
import { FilterSidebarSheet } from "@/components/filters/filter-sidebar-sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { commerce } from "@/lib/commerce";
import type { CollectionOperations } from "@/lib/commerce";
import { buildCollectionAncestorPath } from "@/lib/utils/breadcrumbs";

import type { CollectionResultsData } from "./data";
import { FilterPendingScope } from "./filter-pending-context";
import { CollectionFilters } from "./filters";
import { CollectionResultCount } from "./result-count";
import { CollectionsSortSelect } from "./sort-select";

function Fallback() {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-4 w-32 md:w-56" />
        <Skeleton className="h-4 w-24 md:hidden" />
      </div>
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
  collectionPromise: Promise<Awaited<ReturnType<CollectionOperations["getCollection"]>>>;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const [handle, collection, t, tSearch, menu] = await Promise.all([
    handlePromise,
    collectionPromise,
    getTranslations("collections.breadcrumb"),
    getTranslations("search"),
    commerce.menu.getMegamenuData(locale),
  ]);

  if (!collection) {
    notFound();
  }

  const { title, description } = collection;
  const ancestorPath = buildCollectionAncestorPath(handle, menu);
  const parentHref =
    ancestorPath && ancestorPath.length > 0
      ? ancestorPath[ancestorPath.length - 1]?.href || "/"
      : "/";
  const parentLabel =
    ancestorPath && ancestorPath.length > 0
      ? ancestorPath[ancestorPath.length - 1]?.label || t("home")
      : t("home");

  return (
    <>
      <div className="mb-3 flex items-center justify-between md:hidden">
        <Link
          href={parentHref}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          <span>{parentLabel}</span>
        </Link>
        <CollectionResultCount collectionResultsDataPromise={collectionResultsDataPromise} />
      </div>

      <Breadcrumb className="mb-3 hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {ancestorPath?.length
            ? ancestorPath.map((segment) => (
                <Fragment key={segment.label}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {segment.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={segment.href}>{segment.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span>{segment.label}</span>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))
            : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
  collectionPromise: Promise<Awaited<ReturnType<CollectionOperations["getCollection"]>>>;
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
