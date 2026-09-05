import type { Metadata } from "next";

import { CollectionDetailPage } from "@/components/collections/collection-page";
import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getAllProductsResultsData,
  getCollectionSearchState,
} from "@/lib/collections/server";
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

// Storefront `search()` only supports RELEVANCE and PRICE sort keys.
const ALL_PRODUCTS_SORT_EXCLUDE = [
  "best-selling",
  "date-new-to-old",
  "date-old-to-new",
  "product-name-ascending",
  "product-name-descending",
];

export default async function AllProductsPage({ searchParams }: PageProps<"/collections/all">) {
  const collection = await getAllProductsCollection();

  // Keep searchParams unawaited so the collection header stays in the static shell.
  const searchStatePromise = getCollectionSearchState(searchParams);
  const collectionResultsDataPromise = getAllProductsResultsData({
    searchStatePromise,
  });
  return (
    <CollectionDetailPage
      collection={collection}
      collectionResultsDataPromise={collectionResultsDataPromise}
      handle={ALL_PRODUCTS_HANDLE}
      searchStatePromise={searchStatePromise}
      sortExclude={ALL_PRODUCTS_SORT_EXCLUDE}
    />
  );
}
