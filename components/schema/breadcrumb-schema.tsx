import { toAbsoluteUrl } from "@/lib/seo";

interface BreadcrumbSchemaItem {
  name: string;
  path: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbSchemaItem[] }) {
  if (items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: toAbsoluteUrl(item.path),
      name: item.name,
      position: index + 1,
    })),
  };

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
