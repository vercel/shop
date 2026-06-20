import { siteConfig } from "@/lib/config";
import type { Collection } from "@/lib/types";

import { escapeMarkdown } from "./utils";

function summarize(text: string, max = 200): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

export function llmsTxt({
  collections,
  locale,
}: {
  collections: Collection[];
  locale: string;
}): string {
  const { name, url } = siteConfig;
  const sections: string[] = [];

  sections.push(`# ${escapeMarkdown(name)}`);
  sections.push("");
  sections.push(
    `> Online store. Product, collection, and search pages additionally serve clean Markdown when fetched with an \`Accept: text/markdown\` header — use it to read structured catalog data instead of HTML.`,
  );
  sections.push("");

  sections.push("## Browse");
  sections.push("");
  sections.push(`- [All products](${url}/collections/all): The full product catalog.`);
  sections.push(`- [Search](${url}/search): Full-text product search; append \`?q=<query>\`.`);
  sections.push("");

  if (collections.length > 0) {
    sections.push("## Collections");
    sections.push("");
    for (const collection of collections) {
      const link = `[${escapeMarkdown(collection.title)}](${url}${collection.path})`;
      const description = summarize(collection.description);
      sections.push(description ? `- ${link}: ${escapeMarkdown(description)}` : `- ${link}`);
    }
    sections.push("");
  }

  sections.push("## Discovery");
  sections.push("");
  sections.push(`- [Sitemap](${url}/sitemap.xml): Complete index of product and collection URLs.`);
  sections.push(`- [Robots](${url}/robots.txt): Crawl policy.`);
  sections.push("");

  sections.push("---");
  sections.push("");
  sections.push(`*Locale: ${locale}*`);

  return sections.join("\n");
}
