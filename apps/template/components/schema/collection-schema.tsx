import { siteConfig } from "@/lib/config";

interface CollectionSchemaData {
  handle: string;
  title: string;
  description: string;
  updatedAt: string;
}

export function CollectionSchema({
  collection,
}: {
  collection: CollectionSchemaData;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description || undefined,
    url: `${siteConfig.url}/collections/${collection.handle}`,
    dateModified: collection.updatedAt,
  };

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
