import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  CollectionDetailPage,
  CollectionDetailSkeleton,
} from "@/components/collections/collection-page";
import { getCollectionResultsData, getCollectionSearchState } from "@/lib/collections/server";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getCollection, getCollections } from "@/lib/shopify/operations/collections";

const PLACEHOLDER_HANDLE = "__placeholder__";

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
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === PLACEHOLDER_HANDLE) {
    notFound();
  }

  const [collection, t] = await Promise.all([
    getCollection({ handle, locale }),
    getTranslations("seo"),
  ]);

  if (!collection) {
    const title = t("collectionFallbackTitle");
    const description = t("collectionFallbackDescription");

    return {
      title,
      description,
      alternates: buildAlternates({
        pathname: `/collections/${handle}`,
      }),
      openGraph: buildOpenGraph({
        title,
        description,
        url: `/collections/${handle}`,
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

  const title = collection.seo.title;
  const description = collection.seo.description;

  return {
    title,
    description,
    alternates: buildAlternates({
      pathname: `/collections/${collection.handle}`,
    }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: `/collections/${collection.handle}`,
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

// The page itself reads no URL data so the route has a prefetchable App Shell. Everything that needs
// `params`/`searchParams` lives under one Suspense boundary: a viewport prefetch shows the skeleton
// on click, while a hover runtime prefetch resolves the cached collection header before the click.
export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[handle]">) {
  const tSearch = await getTranslations("search");

  return (
    <Suspense
      fallback={
        <CollectionDetailSkeleton
          filtersLabel={tSearch("filters")}
          sortByLabel={tSearch("sortBy")}
        />
      }
    >
      <CollectionPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectionPageContent({
  params,
  searchParams,
}: Pick<PageProps<"/collections/[handle]">, "params" | "searchParams">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const collection = await getCollection({ handle, locale });
  if (!collection) notFound();

  // Keep searchParams unawaited so the collection header stays in the static shell.
  const searchStatePromise = getCollectionSearchState(searchParams);

  return (
    <CollectionDetailPage
      collection={collection}
      getCollectionResultsData={() =>
        getCollectionResultsData({ handle, locale, searchStatePromise })
      }
      handle={handle}
      locale={locale}
      searchStatePromise={searchStatePromise}
    />
  );
}
