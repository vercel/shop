import { siteConfig } from "@/lib/config";

interface BreadcrumbSchemaItem {
  name: string;
  path: string;
}

function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${siteConfig.url}${path}`;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbSchemaItem[] }) {
  if (items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
