import { Suspense } from "react";

import { CollectionViewedTracker } from "@/components/analytics/trackers";
import { Browse } from "@/components/collections/browse";
import { BrowseFallback } from "@/components/collections/toolbar";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { CollectionSchema } from "@/components/schema/collection-schema";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrowseResults, BrowseState, Collection, SortValue } from "@/lib/collections/types";

interface CollectionDetailPageProps {
  collection: Collection;
  handle: string;
  resultsPromise: Promise<BrowseResults>;
  sortExclude?: SortValue[];
  statePromise: Promise<BrowseState>;
}

export function CollectionDetailPage({
  collection,
  handle,
  resultsPromise,
  sortExclude,
  statePromise,
}: CollectionDetailPageProps) {
  return (
    <>
      {collection.id ? (
        <CollectionViewedTracker collection={{ handle: collection.handle, id: collection.id }} />
      ) : null}
      <Page className="pt-2.5 md:pt-10">
        <Container>
          <Sections className="gap-5">
            <CollectionHeader collection={collection} handle={handle} />
            <Suspense fallback={<BrowseFallback />}>
              <Browse
                path={`/collections/${handle}`}
                results={resultsPromise}
                sortExclude={sortExclude}
                state={statePromise}
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

interface CollectionHeaderProps {
  collection: Collection;
  handle: string;
}

function CollectionHeader({ collection, handle }: CollectionHeaderProps) {
  const { description, title, updatedAt } = collection;

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: title, path: `/collections/${handle}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionSchema collection={{ description, handle, title, updatedAt }} />
      <div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl">
          <Link href={`/collections/${handle}`}>{title}</Link>
        </h1>
        {description && <p className="mt-1 leading-6 text-muted-foreground">{description}</p>}
      </div>
    </>
  );
}
