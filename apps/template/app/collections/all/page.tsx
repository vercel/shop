import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CollectionDetailPage } from "@/components/collections/collection-page";
import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getAllProductsResultsData,
  getCollectionSearchState,
} from "@/lib/collections/server";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections.all");
  const title = t("title");
  const description = t("description");

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

export const unstable_instant = true;

export const unstable_prefetch = "force-runtime";

// Storefront `search()` only supports RELEVANCE and PRICE sort keys.
const ALL_PRODUCTS_SORT_EXCLUDE = [
  "best-selling",
  "date-new-to-old",
  "date-old-to-new",
  "product-name-ascending",
  "product-name-descending",
];

export default async function AllProductsPage({ searchParams }: PageProps<"/collections/all">) {
  const locale = await getLocale();
  const handlePromise = Promise.resolve(ALL_PRODUCTS_HANDLE);
  const collectionPromise = getAllProductsCollection();
  const searchStatePromise = getCollectionSearchState(searchParams);
  const collectionResultsDataPromise = getAllProductsResultsData({
    locale,
    searchStatePromise,
  });

  return (
    <CollectionDetailPage
      handlePromise={handlePromise}
      collectionPromise={collectionPromise}
      collectionResultsDataPromise={collectionResultsDataPromise}
      locale={locale}
      searchStatePromise={searchStatePromise}
      sortExclude={ALL_PRODUCTS_SORT_EXCLUDE}
    />
  );
}
