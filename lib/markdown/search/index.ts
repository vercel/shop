import { getSearchResultUrl } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import { escapeMarkdown, markdownFrontmatter } from "@/lib/markdown";

export function searchToMarkdown(query: string | undefined): string {
  const siteUrl = shopConfig.site.url;
  const term = query?.trim();
  const shopPath = term ? getSearchResultUrl({ baseUrl: "/search", term }) : "/search";

  const title = term ? `Search: ${term}` : "Search";
  const description =
    "Search results change with the live catalog, so this page does not list products.";

  return [
    markdownFrontmatter({
      canonicalUrl: new URL(shopPath, siteUrl).toString(),
      description,
      title,
    }),
    "",
    `# ${escapeMarkdown(title)}`,
    "",
    description,
    "",
    "## Search",
    "",
    `- Shop: ${new URL(shopPath, siteUrl)}`,
    `- Live products, prices, and availability: UCP catalog search at ${new URL("/.well-known/ucp", siteUrl)}`,
  ].join("\n");
}
