import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { getCountryCode, getLanguageCode } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { shopifyFetch } from "@/lib/shopify/client";
import type { ShopifyCollection } from "@/lib/shopify/transforms/collection";
import { transformShopifyCollections } from "@/lib/shopify/transforms/collection";

type CollectionsResponse = {
  collections: { edges: Array<{ node: ShopifyCollection }> };
};

async function CollectionsList() {
  await connection();

  const locale = await getLocale();
  const country = getCountryCode(locale);
  const language = getLanguageCode(locale);

  const data = await shopifyFetch<CollectionsResponse>({
    operation: "getCollectionsUncached",
    query: `
      query getCollectionsUncached($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
        collections(first: 250) {
          edges {
            node {
              handle
              title
              description
              image {
                url
                altText
                width
                height
              }
              updatedAt
              seo {
                title
                description
              }
            }
          }
        }
      }
    `,
    variables: { first: 250, country, language },
  });

  const collections = transformShopifyCollections(data.collections.edges.map((e) => e.node));

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
