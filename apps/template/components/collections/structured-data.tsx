import { Suspense } from "react";

import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { CollectionSchema } from "@/components/schema/collection-schema";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n/server";
import type { getCollection } from "@/lib/shopify/operations/collections";

async function Render({
  locale,
  handlePromise,
  collectionPromise,
}: {
  locale: Locale;
  handlePromise: Promise<string>;
  collectionPromise: Promise<Awaited<ReturnType<typeof getCollection>>>;
}) {
  const [handle, collection, homeLabel] = await Promise.all([
    handlePromise,
    collectionPromise,
    t("collections.breadcrumb.home"),
  ]);

  if (!collection) return null;

  const { title, description, updatedAt } = collection;

  const breadcrumbItems = [
    { name: homeLabel, path: "/" },
    { name: title, path: `/collections/${handle}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionSchema collection={{ handle, title, description, updatedAt }} />
    </>
  );
}

export function CollectionStructuredData({
  locale,
  handlePromise,
  collectionPromise,
}: {
  locale: Locale;
  handlePromise: Promise<string>;
  collectionPromise: Promise<Awaited<ReturnType<typeof getCollection>>>;
}) {
  return (
    <Suspense fallback={null}>
      <Render locale={locale} handlePromise={handlePromise} collectionPromise={collectionPromise} />
    </Suspense>
  );
}
