import type { Metadata } from "next";

import { CollectionDetailPage } from "@/components/collections/collection-page";
import { SEARCH_SORT_EXCLUDE } from "@/lib/collections";
import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  readBrowseState,
} from "@/lib/collections/server";
import { fetchSearchResults } from "@/lib/search/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Products";
  const description = "";
  return {
    title,
    description,
    alternates: buildAlternates({
      pathname: `/collections/${ALL_PRODUCTS_HANDLE}`,
    }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: `/collections/${ALL_PRODUCTS_HANDLE}`,
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export default async function AllProductsPage({ searchParams }: PageProps<"/collections/all">) {
  const collection = await getAllProductsCollection();

  // Keep searchParams unawaited so the collection header stays in the static shell.
  const statePromise = readBrowseState(searchParams);
  return (
    <CollectionDetailPage
      collection={collection}
      handle={ALL_PRODUCTS_HANDLE}
      resultsPromise={fetchSearchResults({ statePromise })}
      sortExclude={SEARCH_SORT_EXCLUDE}
      statePromise={statePromise}
    />
  );
}
