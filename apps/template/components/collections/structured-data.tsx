import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { CollectionSchema } from "@/components/schema/collection-schema";
import type { Locale } from "@/lib/i18n";
import { commerce } from "@/lib/commerce";
import type { CollectionOperations } from "@/lib/commerce";
import { buildCollectionAncestorPath } from "@/lib/utils/breadcrumbs";

async function Render({
  locale,
  handlePromise,
  collectionPromise,
}: {
  locale: Locale;
  handlePromise: Promise<string>;
  collectionPromise: Promise<Awaited<ReturnType<CollectionOperations["getCollection"]>>>;
}) {
  const [handle, collection, t, menu] = await Promise.all([
    handlePromise,
    collectionPromise,
    getTranslations("collections.breadcrumb"),
    commerce.menu.getMegamenuData(locale),
  ]);

  if (!collection) return null;

  const { title, description, updatedAt } = collection;
  const ancestorPath = buildCollectionAncestorPath(handle, menu);

  const breadcrumbItems = ancestorPath
    ? [
        { name: t("home"), path: "/" },
        ...ancestorPath.map((segment) => ({
          name: segment.label,
          path: segment.href || "/",
        })),
        {
          name: title,
          path: `/collections/${handle}`,
        },
      ]
    : [
        { name: t("home"), path: "/" },
        {
          name: title,
          path: `/collections/${handle}`,
        },
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
  collectionPromise: Promise<Awaited<ReturnType<CollectionOperations["getCollection"]>>>;
}) {
  return (
    <Suspense fallback={null}>
      <Render locale={locale} handlePromise={handlePromise} collectionPromise={collectionPromise} />
    </Suspense>
  );
}
