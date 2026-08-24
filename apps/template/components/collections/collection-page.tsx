import { SlidersHorizontalIcon } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { CollectionViewedTracker } from "@/components/analytics/trackers";
import { CollectionHero } from "@/components/collections/collection-hero";
import { FilterSidebarSheet } from "@/components/collections/filter-sidebar-sheet";
import { CollectionFilters } from "@/components/collections/filters";
import { CollectionResultsGrid } from "@/components/collections/results-grid";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { SortSelectFallback } from "@/components/collections/sort-select-fallback";
import { CollectionToolbar } from "@/components/collections/toolbar";
import { ProductsGridSkeleton } from "@/components/product/products-grid";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { CollectionSchema } from "@/components/schema/collection-schema";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import type { CollectionResultsData, CollectionSearchState } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";
import type { Collection } from "@/lib/types";

import {
  CollectionActiveFilterCountBadge,
  CollectionBrowseProvider,
} from "./collection-browse-provider";
import { FilterPendingScope } from "./filter-pending-context";

export async function CollectionDetailPage({
  collection,
  collectionResultsDataPromise,
  handle,
  locale,
  searchStatePromise,
  sortExclude,
}: {
  collection: Collection;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
  handle: string;
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
  sortExclude?: string[];
}) {
  const [messages, tSearch, tBreadcrumb] = await Promise.all([
    getMessages(),
    getTranslations("search"),
    getTranslations("collections.breadcrumb"),
  ]);
  const filtersLabel = tSearch("filters");
  const sortByLabel = tSearch("sortBy");

  return (
    <>
      {collection.id ? (
        <CollectionViewedTracker collection={{ handle: collection.handle, id: collection.id }} />
      ) : null}
      <Page className={collection.image ? "pt-0" : "pt-2.5 md:pt-10"}>
        <Sections className="gap-5">
          <CollectionHeader
            collection={collection}
            handle={handle}
            homeLabel={tBreadcrumb("home")}
          />

          <Container>
            <Suspense
              fallback={
                <CollectionBrowseFallback filtersLabel={filtersLabel} sortByLabel={sortByLabel} />
              }
            >
              <NextIntlClientProvider
                messages={{ category: messages.category, search: messages.search }}
              >
                <CollectionBrowseProvider handle={handle} searchStatePromise={searchStatePromise}>
                  <CollectionToolbar
                    filterSheet={
                      <FilterSidebarSheet
                        label={filtersLabel}
                        trigger={
                          <button
                            type="button"
                            className="flex items-center gap-2 text-sm font-medium"
                          >
                            <SlidersHorizontalIcon className="size-4" />
                            <span>{filtersLabel}</span>
                            <CollectionActiveFilterCountBadge />
                          </button>
                        }
                      >
                        <FilterPendingScope>
                          <CollectionFilters
                            collectionResultsDataPromise={collectionResultsDataPromise}
                          />
                        </FilterPendingScope>
                      </FilterSidebarSheet>
                    }
                    sortSelect={<CollectionsSortSelect collection exclude={sortExclude} />}
                  />

                  <FilterPendingScope>
                    <CollectionResultsGrid
                      locale={locale}
                      collectionResultsDataPromise={collectionResultsDataPromise}
                    />
                  </FilterPendingScope>
                </CollectionBrowseProvider>
              </NextIntlClientProvider>
            </Suspense>
          </Container>
        </Sections>
      </Page>
    </>
  );
}

function CollectionBrowseFallback({
  filtersLabel,
  sortByLabel,
}: {
  filtersLabel: string;
  sortByLabel: string;
}) {
  return (
    <>
      <CollectionToolbar
        filterSheet={
          <button type="button" className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontalIcon className="size-4" />
            <span>{filtersLabel}</span>
          </button>
        }
        sortSelect={<SortSelectFallback label={sortByLabel} />}
      />
      <ProductsGridSkeleton count={40} className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
    </>
  );
}

function CollectionHeader({
  collection,
  handle,
  homeLabel,
}: {
  collection: Collection;
  handle: string;
  homeLabel: string;
}) {
  const { description, image, title, updatedAt } = collection;

  const breadcrumbItems = [
    { name: homeLabel, path: "/" },
    { name: title, path: `/collections/${handle}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionSchema collection={{ handle, title, description, updatedAt }} />
      {image ? (
        <CollectionHero image={image} title={title} />
      ) : (
        <Container>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl">
              <Link href={`/collections/${handle}`}>{title}</Link>
            </h1>
            {description && <p className="mt-1 leading-6 text-muted-foreground">{description}</p>}
          </div>
        </Container>
      )}
    </>
  );
}
