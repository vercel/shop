import { shopConfig } from "@/lib/config";

import { escapeMarkdown } from "./utils";

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

- [Search products](${url}/search)
- [Browse all products](${url}/collections/all)
- [Storefront guide](${url}/llms.txt)
- [Sitemap](${url}/sitemap.xml)
`;
}
