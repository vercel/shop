import { getSearchResultUrl } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import { escapeMarkdown } from "@/lib/markdown";

export function searchToMarkdown(query: string | undefined): string {
  const siteUrl = shopConfig.site.url;
  const term = query?.trim();
  const shopPath = term ? getSearchResultUrl({ baseUrl: "/search", term }) : "/search";

  return [
    term ? `# Search: ${escapeMarkdown(term)}` : "# Search",
    "",
    "Search results change with the live catalog, so this page does not list products.",
    "",
    "## Search",
    "",
    `- Shop: ${new URL(shopPath, siteUrl)}`,
    `- Live products, prices, and availability: UCP catalog search at ${new URL("/.well-known/ucp", siteUrl)}`,
  ].join("\n");
}
