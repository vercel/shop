export function markdownFrontmatter({
  canonicalUrl,
  description,
  lastUpdated,
  title,
}: {
  canonicalUrl: string;
  description?: string;
  lastUpdated?: string;
  title: string;
}): string {
  // JSON strings are valid YAML double-quoted scalars.
  const fields = [
    `title: ${JSON.stringify(title)}`,
    description ? `description: ${JSON.stringify(description)}` : null,
    `canonical_url: ${JSON.stringify(canonicalUrl)}`,
    lastUpdated ? `last_updated: ${JSON.stringify(lastUpdated)}` : null,
  ].filter((field) => field !== null);
  return ["---", ...fields, "---"].join("\n");
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[|*_`]/g, "\\$&").replace(/^#/gm, "\\#");
}
