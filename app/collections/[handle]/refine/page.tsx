import type { Metadata } from "next";

import { CollectionResults } from "@/components/collections/browse";
import { CollectionBrowseBoundary } from "@/components/collections/collection-page";
import {
  fetchCollectionResults,
  getCollectionMetadata,
  readBrowseState,
} from "@/lib/collections/server";

export async function generateMetadata({
  params,
}: PageProps<"/collections/[handle]/refine">): Promise<Metadata> {
  const { handle } = await params;
  return getCollectionMetadata(handle);
}

export default function RefinedCollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[handle]/refine">) {
  return (
    <CollectionBrowseBoundary>
      <RefinedCollectionResults params={params} searchParams={searchParams} />
    </CollectionBrowseBoundary>
  );
}

async function RefinedCollectionResults({
  params,
  searchParams,
}: PageProps<"/collections/[handle]/refine">) {
  const { handle } = await params;
  const statePromise = readBrowseState(searchParams);
  return <CollectionResults results={fetchCollectionResults({ handle, statePromise })} />;
}
