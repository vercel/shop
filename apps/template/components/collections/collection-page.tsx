import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CollectionResultsSection } from "@/components/collections/results";
import { CollectionStructuredData } from "@/components/collections/structured-data";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionResultsData, getCollectionSearchState } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";
import type { getCollection } from "@/lib/shopify/operations/collections";

import { FilterTransitionProvider } from "./filter-pending-context";

export function CollectionDetailPage({
  handlePromise,
  collectionPromise,
  locale,
  searchParams,
}: {
  handlePromise: Promise<string>;
  collectionPromise: Promise<Awaited<ReturnType<typeof getCollection>>>;
  locale: Locale;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchStatePromise = getCollectionSearchState(searchParams);
  const collectionResultsDataPromise = getCollectionResultsData({
    handlePromise,
    locale,
    searchStatePromise,
  });

  return (
    <FilterTransitionProvider>
      <Container className="pt-2.5 md:pt-10">
        <CollectionStructuredData
          locale={locale}
          handlePromise={handlePromise}
          collectionPromise={collectionPromise}
        />

        <Suspense fallback={<CollectionTitleSkeleton />}>
          <CollectionTitle collectionPromise={collectionPromise} />
        </Suspense>

        <CollectionResultsSection
          locale={locale}
          collectionResultsDataPromise={collectionResultsDataPromise}
        />
      </Container>
    </FilterTransitionProvider>
  );
}

async function CollectionTitle({
  collectionPromise,
}: {
  collectionPromise: Promise<Awaited<ReturnType<typeof getCollection>>>;
}) {
  const collection = await collectionPromise;

  if (!collection) {
    notFound();
  }

  const { title, description } = collection;

  return (
    <div className="mb-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
        <Link href={`/collections/${collection.handle}`}>{title}</Link>
      </h1>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
    </div>
  );
}

function CollectionTitleSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-10 sm:h-11 md:h-13 w-72" />
    </div>
  );
}
