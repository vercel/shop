import { getSearchResultUrl } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import { escapeRequestText, markdownFrontmatter } from "@/lib/markdown";
import { SEARCH_TERM_MAX_LENGTH } from "@/lib/search";

function normalizeSearchTerm(query: string | undefined): string {
  const term = query?.replace(/[\s\p{Cc}]+/gu, " ").trim() ?? "";
  return Array.from(term).slice(0, SEARCH_TERM_MAX_LENGTH).join("").trimEnd();
}

export function searchToMarkdown(query: string | undefined): string {
  const siteUrl = shopConfig.site.url;
  const term = normalizeSearchTerm(query);
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
    `# ${term ? `Search: ${escapeRequestText(term)}` : "Search"}`,
    "",
    description,
    "",
    "## Search",
    "",
    `- Shop: ${new URL(shopPath, siteUrl)}`,
    `- Live products, prices, and availability: UCP catalog search at ${new URL("/.well-known/ucp", siteUrl)}`,
  ].join("\n");
}
