import { shopConfig } from "@/lib/config";
import type { Collection } from "@/lib/types";

import { escapeMarkdown } from "./utils";

function summarize(text: string, max = 200): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

export function llmsTxt({
  collections,
  locale = shopConfig.localization.locale,
}: {
  collections: Collection[];
  locale?: string;
}): string {
  const { name, url } = shopConfig.site;
  const sections: string[] = [];

  sections.push(`# ${escapeMarkdown(name)}`);
  sections.push("");
  sections.push(
    `> Online store. The homepage, product, collection, and search pages serve clean Markdown when fetched with an \`Accept: text/markdown\` header.`,
  );
  sections.push("");

  sections.push("## When to use this storefront");
  sections.push("");
  sections.push("Use this storefront to discover, compare, and purchase its products.");
  sections.push("");
  sections.push("- Search when a shopper describes what they need.");
  sections.push(
    "- Fetch product and collection URLs as Markdown to compare prices, variants, availability, and product details.",
  );
  sections.push("- Use a browser-capable flow for cart and checkout actions.");
  sections.push(
    "- Do not treat this storefront as developer documentation or a general-purpose public API.",
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
