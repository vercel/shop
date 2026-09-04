import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  CollectionDetailPage,
  CollectionDetailSkeleton,
} from "@/components/collections/collection-page";
import { RememberCollection } from "@/components/collections/remember-collection";
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
}: PageProps<"/[flags]/[locale]/collections/[handle]">): Promise<Metadata> {
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

// The page itself reads no URL data (root params only), so the route has a prefetchable App Shell
// and client navigations paint immediately. Everything that needs `params`/`searchParams` lives
// under one Suspense boundary: a plain viewport prefetch shows the skeleton on click, while a
// per-link runtime prefetch (prefetch={true}) resolves the cached collection before the click.
export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/[flags]/[locale]/collections/[handle]">) {
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
}: Pick<PageProps<"/[flags]/[locale]/collections/[handle]">, "params" | "searchParams">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const collection = await getCollection({ handle, locale });
  if (!collection) notFound();

  // Keep searchParams unawaited so the collection header stays in the static shell.
  const searchStatePromise = getCollectionSearchState(searchParams);
  const collectionResultsDataPromise = getCollectionResultsData({
    handle,
    locale,
    searchStatePromise,
  });

  return (
    <>
      <RememberCollection handle={handle} />
      {/* BISECT: header outside the browse boundary */}
      <h1 data-bisect="header" className="sr-only">
        {collection.title}
      </h1>
      <Suspense fallback={<p data-bisect="browse-fallback" className="sr-only">browse</p>}>
        <CollectionDetailPage
          collection={collection}
          collectionResultsDataPromise={collectionResultsDataPromise}
          handle={handle}
          locale={locale}
          searchStatePromise={searchStatePromise}
        />
      </Suspense>
    </>
  );
}
