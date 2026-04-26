import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionDetailPage } from "@/components/collections/collection-page";
import { t } from "@/lib/i18n/server";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getCollection } from "@/lib/shopify/operations/collections";

// export async function generateStaticParams() {
//   return [{ handle: "__placeholder__" }];
// }

export async function generateMetadata({
  params,
}: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  const collection = await getCollection(handle, locale);

  if (!collection) {
    const [title, description] = await Promise.all([
      t("seo.collectionFallbackTitle"),
      t("seo.collectionFallbackDescription"),
    ]);

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

export const unstable_instant = {
  samples: [
    {
      params: { handle: "__placeholder__" },
      searchParams: {
        sort: null,
      },
      cookies: [{ name: "shopify_cartId", value: null }],
    },
  ],
};

export const unstable_prefetch = "force-runtime";

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[handle]">) {
  const [locale] = await Promise.all([getLocale()]);
  const handlePromise = params.then(({ handle }) => handle);

  const collectionPromise = handlePromise.then((handle) => getCollection(handle, locale));

  return (
    <CollectionDetailPage
      handlePromise={handlePromise}
      collectionPromise={collectionPromise}
      locale={locale}
      searchParams={searchParams}
    />
  );
}
