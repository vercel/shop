import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CollectionView, CollectionViewFallback } from "@/components/storefront/collection-view";
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

// Storefront `search()` only supports RELEVANCE and PRICE sort keys.
const ALL_PRODUCTS_SORT_EXCLUDE = [
  "best-selling",
  "date-new-to-old",
  "date-old-to-new",
  "product-name-ascending",
  "product-name-descending",
];

export default async function AllProductsPage({ searchParams }: PageProps<"/collections/all">) {
  const [locale, collection] = await Promise.all([getLocale(), getAllProductsCollection()]);

  // Keep searchParams unawaited so only the results/filters/sort stream; the
  // collection header resolves here and renders into the static shell.
  const searchStatePromise = getCollectionSearchState(searchParams);
  const collectionResultsDataPromise = getAllProductsResultsData({
    locale,
    searchStatePromise,
  });

  return (
    <Suspense fallback={<CollectionViewFallback handle={ALL_PRODUCTS_HANDLE} locale={locale} />}>
      <CollectionView
        collection={collection}
        collectionResultsDataPromise={collectionResultsDataPromise}
        locale={locale}
        searchStatePromise={searchStatePromise}
        sortExclude={ALL_PRODUCTS_SORT_EXCLUDE}
      />
    </Suspense>
  );
}
