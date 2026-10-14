import type { Metadata } from "next";

import { CollectionResults } from "@/components/collections/browse";
import { CollectionBrowseBoundary } from "@/components/collections/collection-page";
import { getAllProductsMetadata, readBrowseState } from "@/lib/collections/server";
import { fetchSearchResults } from "@/lib/search/server";

export async function generateMetadata(): Promise<Metadata> {
  return getAllProductsMetadata();
}

export default function RefinedAllProductsPage({
  searchParams,
}: PageProps<"/collections/all/refine">) {
  return (
    <CollectionBrowseBoundary>
      <RefinedAllProductsResults searchParams={searchParams} />
    </CollectionBrowseBoundary>
  );
}

async function RefinedAllProductsResults({
  searchParams,
}: Pick<PageProps<"/collections/all/refine">, "searchParams">) {
  const statePromise = readBrowseState(searchParams);
  return <CollectionResults results={fetchSearchResults({ statePromise })} />;
}
