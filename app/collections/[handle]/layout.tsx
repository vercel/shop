import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  CollectionDetailSkeleton,
  CollectionLayout,
} from "@/components/collections/collection-page";
import { getCollection, getCollections } from "@/lib/collections/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

export async function generateStaticParams() {
  try {
    const collections = await getCollections();
    return collections.length > 0
      ? collections.map(({ handle }) => ({ handle }))
      : [{ handle: PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export default function CollectionHandleLayout({
  children,
  params,
}: LayoutProps<"/collections/[handle]">) {
  return (
    <Suspense fallback={<CollectionDetailSkeleton />}>
      <CollectionHandleLayoutContent params={params}>{children}</CollectionHandleLayoutContent>
    </Suspense>
  );
}

async function CollectionHandleLayoutContent({
  children,
  params,
}: Pick<LayoutProps<"/collections/[handle]">, "children" | "params">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  const collection = await getCollection({ handle });
  if (!collection) notFound();

  return (
    <CollectionLayout collection={collection} handle={handle}>
      {children}
    </CollectionLayout>
  );
}
