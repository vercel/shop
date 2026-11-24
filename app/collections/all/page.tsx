import type { Metadata } from "next";

import { CollectionDetailPage } from "@/components/collections/collection-page";
import { SEARCH_SORT_EXCLUDE } from "@/lib/collections";
import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getAllProductsMetadata,
  getAllProductsResults,
  readBrowseState,
} from "@/lib/collections/server";
import { fetchSearchResults } from "@/lib/search/server";

export async function generateMetadata(): Promise<Metadata> {
  return getAllProductsMetadata();
}

export default async function AllProductsPage({ searchParams }: PageProps<"/collections/all">) {
  // Keep searchParams unawaited so the collection header stays in the static shell.
  const statePromise = readBrowseState(searchParams);
  return (
    <CollectionDetailPage
      collection={await getAllProductsCollection()}
      handle={ALL_PRODUCTS_HANDLE}
      resultsPromise={statePromise.then(({ dataSearch }) =>
        dataSearch ? fetchSearchResults({ statePromise }) : getAllProductsResults(),
      )}
      sortExclude={SEARCH_SORT_EXCLUDE}
      statePromise={statePromise}
    />
  );
}
