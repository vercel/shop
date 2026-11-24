import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  CollectionDetailPage,
  CollectionDetailSkeleton,
} from "@/components/collections/collection-page";
import {
  fetchCollectionResults,
  getCollection,
  getCollectionMetadata,
  getCollectionResults,
  getCollections,
  readBrowseState,
} from "@/lib/collections/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

// One handle, as on the product page, so build work does not grow with the catalog; other collections render on first request.
export async function generateStaticParams() {
  try {
    const collections = await getCollections({ limit: 1 });
    const first = collections[0];
    return [{ handle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  return getCollectionMetadata(handle);
}

export default function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[handle]">) {
  return (
    <Suspense fallback={<CollectionDetailSkeleton />}>
      <CollectionPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectionPageContent({ params, searchParams }: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  const collection = await getCollection({ handle });
  if (!collection) notFound();

  // Keep searchParams unawaited so the collection header stays in the static shell.
  const statePromise = readBrowseState(searchParams);
  return (
    <CollectionDetailPage
      collection={collection}
      handle={handle}
      resultsPromise={statePromise.then(({ dataSearch }) =>
        dataSearch
          ? fetchCollectionResults({ handle, statePromise })
          : getCollectionResults({ handle }),
      )}
      statePromise={statePromise}
    />
  );
}
