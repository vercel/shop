import { describeCollection } from "@/lib/collections";
import type { Collection } from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import { escapeMarkdown, markdownFrontmatter } from "@/lib/markdown";

export function collectionToMarkdown(collection: Collection): string {
  const siteUrl = shopConfig.site.url;
  const description = collection.description || collection.seo.description;
  const sections: string[] = [
    markdownFrontmatter({
      canonicalUrl: new URL(collection.path, siteUrl).toString(),
      description: describeCollection(collection),
      lastUpdated: collection.updatedAt,
      title: collection.title,
    }),
    "",
    `# ${escapeMarkdown(collection.title)}`,
    "",
  ];

  if (description) sections.push(escapeMarkdown(description), "");

  if (collection.image?.url) {
    sections.push(`![${escapeMarkdown(collection.image.altText)}](${collection.image.url})`, "");
  }

  sections.push(
    "## Browse",
    "",
    `- Shop: ${new URL(collection.path, siteUrl)}`,
    `- Live products, prices, and availability: UCP catalog search at ${new URL("/.well-known/ucp", siteUrl)}`,
  );

  return sections.join("\n");
}
