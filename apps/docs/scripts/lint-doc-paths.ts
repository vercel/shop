// Validates that every backtick'd file path inside a "## Key files" section
// of an MDX doc resolves to a real file or directory in the repo.
// Usage: npx tsx apps/docs/scripts/lint-doc-paths.ts

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const DOCS_DIR = resolve(__dirname, "../content");
const TEMPLATE_DIR = resolve(REPO_ROOT, "apps/template");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.endsWith(".mdx")) out.push(full);
  }
  return out;
}

function extractKeyFilesSection(src: string): string | null {
  const start = src.search(/^##\s+Key\s+[Ff]iles\b[^\n]*$/m);
  if (start === -1) return null;
  const after = src.slice(start);
  const next = after.slice(1).search(/^##\s/m);
  return next === -1 ? after : after.slice(0, next + 1);
}

const PATH_LIKE = /`([^`\n]+)`/g;

function isPathLike(s: string): boolean {
  return s.includes("/") && !s.startsWith("http") && !s.includes(" ");
}

function resolvePath(p: string): { abs: string; existed: boolean } {
  const candidates = p.startsWith("apps/")
    ? [resolve(REPO_ROOT, p)]
    : [resolve(TEMPLATE_DIR, p), resolve(REPO_ROOT, p)];
  for (const abs of candidates) {
    if (existsSync(abs)) {
      const wantsDir = p.endsWith("/");
      const isDir = statSync(abs).isDirectory();
      if (wantsDir && !isDir) continue;
      return { abs, existed: true };
    }
  }
  return { abs: candidates[0], existed: false };
}

const failures: { file: string; path: string }[] = [];
let checked = 0;

for (const file of walk(DOCS_DIR)) {
  const src = readFileSync(file, "utf8");
  const section = extractKeyFilesSection(src);
  if (!section) continue;

  const seen = new Set<string>();
  for (const m of section.matchAll(PATH_LIKE)) {
    const candidate = m[1].trim();
    if (!isPathLike(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);
    checked++;
    const { existed } = resolvePath(candidate);
    if (!existed) failures.push({ file, path: candidate });
  }
}

const rel = (f: string) => f.slice(REPO_ROOT.length + 1);

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} broken path(s) in docs (${checked} checked):\n`);
  for (const { file, path } of failures) {
    console.error(`  ${rel(file)}\n    → \`${path}\` not found in apps/template/ or repo root`);
  }
  process.exit(1);
}

console.log(`✓ ${checked} doc path(s) verified`);
