import { shopConfig } from "@/lib/config";

export function notFoundMarkdown({ kind }: { kind: "Collection" | "Product" }): string {
  const { url } = shopConfig.site;

  return `# ${kind} Not Found

The requested ${kind.toLowerCase()} could not be found.

## Continue browsing

- [Browse all products](${url}/collections/all)
- [UCP profile](${url}/.well-known/ucp): Live catalog search, availability, cart, and checkout
- [Storefront guide](${url}/llms.txt)
- [Sitemap](${url}/sitemap.xml)
`;
}
