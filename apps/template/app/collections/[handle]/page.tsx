import { buildAlternates, buildOpenGraph } from "@/lib/seo";

import { CollectionDetailPage } from "@/components/collections/collection-page";
import { getCollection } from "@/lib/shopify/operations/collections";
import { getLocale } from "@/lib/params";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

  const [collection, t] = await Promise.all([
    getCollection(handle, locale),
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

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[handle]">) {
  const [locale] = await Promise.all([getLocale()]);
  const handlePromise = params.then(({ handle }) => handle);

  const collectionPromise = handlePromise.then((handle) =>
    getCollection(handle, locale),
  );

  return (
    <CollectionDetailPage
      handlePromise={handlePromise}
      collectionPromise={collectionPromise}
      locale={locale}
      searchParams={searchParams}
    />
  );
}
