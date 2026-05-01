// Syncs SKILL.md content into content/docs/skills/*.mdx between BEGIN/END SKILL CONTENT markers.
// Usage: npx tsx apps/docs/scripts/sync-skills.ts

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "../content/docs/skills");
const SKILLS_DIR = join(__dirname, "../../../packages/plugin/skills");

function stripFrontmatter(content: string): string {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      return content.slice(end + 3).trim();
    }
  }
  return content.trim();
}

const BEGIN_RE = /\{\/\* BEGIN SKILL CONTENT: (.+?) \*\/\}/;
const END_RE = (skill: string) =>
  new RegExp(`\\{/\\* END SKILL CONTENT: ${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\*/\\}`);

let updated = 0;
let skipped = 0;
let errors = 0;

const mdxFiles = readdirSync(DOCS_DIR).filter((f) => f.endsWith(".mdx"));

for (const file of mdxFiles) {
  const mdxPath = join(DOCS_DIR, file);
  const mdx = readFileSync(mdxPath, "utf-8");

  const beginMatch = mdx.match(BEGIN_RE);
  if (!beginMatch) {
    skipped++;
    continue;
  }

  const skillName = beginMatch[1];
  const skillPath = join(SKILLS_DIR, skillName, "SKILL.md");

  let skillRaw: string;
  try {
    skillRaw = readFileSync(skillPath, "utf-8");
  } catch {
    console.error(`  SKIP ${file}: SKILL.md not found at ${skillPath}`);
    errors++;
    continue;
  }

  const skillContent = stripFrontmatter(skillRaw);
  const endRe = END_RE(skillName);
  const endMatch = mdx.match(endRe);

  if (!endMatch) {
    console.error(`  SKIP ${file}: missing END delimiter for ${skillName}`);
    errors++;
    continue;
  }

  const beginIdx = mdx.indexOf(beginMatch[0]);
  const endIdx = mdx.indexOf(endMatch[0]);

  const before = mdx.slice(0, beginIdx + beginMatch[0].length);
  const after = mdx.slice(endIdx);

  const newMdx = `${before}\n\n${skillContent}\n\n${after}`;

  if (newMdx !== mdx) {
    writeFileSync(mdxPath, newMdx);
    console.log(`  UPDATED ${file} ← ${skillName}`);
    updated++;
  } else {
    console.log(`  OK ${file} (no changes)`);
    skipped++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${errors} errors`);
