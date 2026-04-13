import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { getLocale } from "@/lib/params";
import { getCollections } from "@/lib/shopify/operations/collections";

async function CollectionsList() {
  const locale = await getLocale();
  const collections = await getCollections(locale);

  return (
    <div className="grid gap-4">
      {collections.map((collection) => (
        <Link
          key={collection.handle}
          href={collection.path}
          className="block rounded-lg border p-4 hover:bg-neutral-50"
        >
          <h2 className="font-medium">{collection.title}</h2>
          {collection.description && (
            <p className="mt-1 text-sm text-neutral-500">{collection.description}</p>
          )}
          <p className="mt-1 text-xs text-neutral-400">
            Updated: {new Date(collection.updatedAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Container>
      <h1 className="mb-6 text-2xl font-bold">Collections</h1>
      <Suspense fallback={<p className="text-neutral-500">Loading collections...</p>}>
        <CollectionsList />
      </Suspense>
    </Container>
  );
}
