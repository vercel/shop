import { shopConfig } from "@/lib/config";
import { escapeMarkdown } from "@/lib/markdown";

export function notFoundMarkdown({
  kind,
  value,
}: {
  kind: "Collection" | "Product";
  value: string;
}): string {
  const { url } = shopConfig.site;

  return `# ${kind} Not Found

The ${kind.toLowerCase()} \`${escapeMarkdown(value)}\` could not be found.

## Continue browsing

- [Browse all products](${url}/collections/all)
- [UCP profile](${url}/.well-known/ucp): Live catalog search, availability, cart, and checkout
- [Storefront guide](${url}/llms.txt)
- [Sitemap](${url}/sitemap.xml)
`;
}
