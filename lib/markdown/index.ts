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

// Request text stays on one line with every ASCII punctuation mark escaped, so it cannot add blocks, links, images, HTML, or code spans.
export function escapeRequestText(text: string): string {
  return text
    .replace(/[\s\p{Cc}]+/gu, " ")
    .trim()
    .replace(/[!-/:-@[-`{-~]/g, "\\$&");
}
