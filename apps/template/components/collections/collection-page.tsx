import Link from "next/link";
import { Suspense } from "react";

import { CollectionViewedTracker } from "@/components/analytics/trackers";
import { CollectionResultsGrid } from "@/components/collections/results-grid";
import { BrowseFallback, BrowseToolbar } from "@/components/collections/toolbar";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { CollectionSchema } from "@/components/schema/collection-schema";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import type { CollectionResultsData, CollectionSearchState } from "@/lib/collections/server";
import type { Collection } from "@/lib/types";

import { CollectionBrowseProvider } from "./collection-browse-provider";
import { FilterPendingScope } from "./filter-pending-context";

export function CollectionDetailPage({
  collection,
  collectionResultsDataPromise,
  handle,
  searchStatePromise,
  sortExclude,
}: {
  collection: Collection;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
  handle: string;
  searchStatePromise: Promise<CollectionSearchState>;
  sortExclude?: string[];
}) {
  return (
    <>
      {collection.id ? (
        <CollectionViewedTracker collection={{ handle: collection.handle, id: collection.id }} />
      ) : null}
      <Page className="pt-2.5 md:pt-10">
        <Container>
          <Sections className="gap-5">
            <CollectionHeader collection={collection} handle={handle} homeLabel="Home" />

            <Suspense fallback={<BrowseFallback />}>
              <CollectionBrowseProvider handle={handle} searchStatePromise={searchStatePromise}>
                <BrowseToolbar
                  facetsPromise={collectionResultsDataPromise.then(
                    (data) => data.transformedFilters,
                  )}
                  sortExclude={sortExclude}
                />

                <FilterPendingScope>
                  <CollectionResultsGrid
                    collectionResultsDataPromise={collectionResultsDataPromise}
                  />
                </FilterPendingScope>
              </CollectionBrowseProvider>
            </Suspense>
          </Sections>
        </Container>
      </Page>
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
  const { title, description, updatedAt } = collection;

  const breadcrumbItems = [
    { name: homeLabel, path: "/" },
    { name: title, path: `/collections/${handle}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionSchema collection={{ handle, title, description, updatedAt }} />
      <div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl">
          <Link href={`/collections/${handle}`}>{title}</Link>
        </h1>
        {description && <p className="mt-1 leading-6 text-muted-foreground">{description}</p>}
      </div>
    </>
  );
}
