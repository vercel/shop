import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  CollectionDetailSkeleton,
  CollectionLayout,
} from "@/components/collections/collection-page";
import { getCollection, getCollections } from "@/lib/collections/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

// One handle, as on the product page, so build work does not grow with the catalog; other collections render on first request.
export async function generateStaticParams() {
  try {
    const collections = await getCollections({ limit: 1 });
    const first = collections[0];
    return [{ handle: first ? first.handle : PLACEHOLDER_HANDLE }];
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
