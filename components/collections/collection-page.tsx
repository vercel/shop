import { Suspense } from "react";

import { CollectionViewedTracker } from "@/components/analytics/trackers";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { CollectionSchema } from "@/components/schema/collection-schema";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrowseResults, BrowseState, Collection, SortValue } from "@/lib/collections/types";
import { formatCount } from "@/lib/content";

import { Browse, BrowseFallback } from "./browse";

export function CollectionDetailPage({
  collection,
  countPromise,
  handle,
  resultsPromise,
  sortExclude,
  statePromise,
}: {
  collection: Collection;
  countPromise?: Promise<number | undefined>;
  handle: string;
  resultsPromise: Promise<BrowseResults>;
  sortExclude?: SortValue[];
  statePromise: Promise<BrowseState>;
}) {
  const resultCount = countPromise ? (
    <Suspense fallback={<Skeleton className="h-4 w-20" />}>
      <CollectionResultCount countPromise={countPromise} />
    </Suspense>
  ) : undefined;
  return (
    <>
      {collection.id ? (
        <CollectionViewedTracker collection={{ handle: collection.handle, id: collection.id }} />
      ) : null}
      <Page className="pt-2.5 md:pt-10">
        <Container>
          <Sections className="gap-5">
            <CollectionHeader collection={collection} handle={handle} homeLabel="Home" />

            <Suspense fallback={<BrowseFallback resultCount={resultCount} />}>
              <Browse
                resultCount={resultCount}
                resultsPromise={resultsPromise}
                sortExclude={sortExclude}
                statePromise={statePromise}
                storeKey={handle}
              />
            </Suspense>
          </Sections>
        </Container>
      </Page>
    </>
  );
}

export function CollectionDetailSkeleton() {
  return (
    <Page aria-busy="true" className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <div className="grid gap-2.5">
            <Skeleton className="h-9 w-64 sm:h-10 md:h-12 md:w-80" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <BrowseFallback />
        </Sections>
      </Container>
    </Page>
  );
}

async function CollectionResultCount({
  countPromise,
}: {
  countPromise: Promise<number | undefined>;
}) {
  const total = await countPromise;
  if (!total) return null;
  return formatCount(total, "Item");
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
