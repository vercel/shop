import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { Streamdown } from "streamdown";
import { z } from "zod";

const CHANGELOG_DIR = join(process.cwd(), "content/changelog");

// Files that are format docs, not real entries.
const SKIPPED_FILES = new Set(["_template.md", "README.md"]);

const entrySchema = z.object({
  title: z.string(),
  changeKey: z.string(),
  introducedOn: z.string(), // YYYY-MM-DD
  pr: z.number(),
  changeType: z.enum(["feature", "fix", "breaking", "refactor", "chore"]),
  defaultAction: z.enum(["adopt", "review"]),
  appliesTo: z.array(z.string()),
  paths: z.array(z.string()),
  relatedSkills: z.array(z.string()).default([]),
});

type Entry = z.infer<typeof entrySchema> & { slug: string; body: string };

function splitFrontmatter(content: string): { frontmatter: string; body: string } {
  if (!content.startsWith("---")) {
    return { frontmatter: "", body: content.trim() };
  }
  const end = content.indexOf("---", 3);
  if (end === -1) {
    return { frontmatter: "", body: content.trim() };
  }
  return {
    frontmatter: content.slice(3, end).trim(),
    body: content.slice(end + 3).trim(),
  };
}

// Minimal parser for the entry frontmatter: scalar `key: value` and
// `key:` followed by a `- item` list. No quoting/escaping support —
// keep entry frontmatter simple. Unknown keys are ignored.
function parseFrontmatter(raw: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let currentListKey: string | null = null;
  const listAcc: Record<string, string[]> = {};

  for (const line of raw.split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    const listMatch = /^\s+-\s+(.*)$/.exec(line);
    if (listMatch && currentListKey) {
      listAcc[currentListKey].push(listMatch[1].trim());
      continue;
    }
    const scalarMatch = /^([\w-]+):\s*(.*)$/.exec(line);
    if (scalarMatch) {
      const [, key, value] = scalarMatch;
      if (value === "") {
        currentListKey = key;
        listAcc[key] = [];
      } else if (value === "[]") {
        currentListKey = null;
        out[key] = [];
      } else if (value.startsWith("[") && value.endsWith("]")) {
        currentListKey = null;
        out[key] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        currentListKey = null;
        out[key] = value;
      }
    }
  }

  for (const [key, items] of Object.entries(listAcc)) {
    out[key] = items;
  }
  return out;
}

function withNumberPr(raw: Record<string, unknown>): Record<string, unknown> {
  if (typeof raw.pr === "string") {
    const n = Number.parseInt(raw.pr, 10);
    raw.pr = Number.isNaN(n) ? 0 : n;
  }
  return raw;
}

async function loadEntries(): Promise<Entry[]> {
  let files: string[];
  try {
    files = await readdir(CHANGELOG_DIR);
  } catch {
    return [];
  }
  const mdFiles = files.filter((f) => f.endsWith(".md") && !SKIPPED_FILES.has(f));

  const entries: Entry[] = [];
  for (const file of mdFiles) {
    const raw = await readFile(join(CHANGELOG_DIR, file), "utf-8");
    const { frontmatter, body } = splitFrontmatter(raw);
    const parsed = entrySchema.safeParse(withNumberPr(parseFrontmatter(frontmatter)));
    if (!parsed.success) {
      // Skip malformed entries rather than breaking the page.
      continue;
    }
    entries.push({ ...parsed.data, slug: file.replace(/\.md$/, ""), body });
  }
  return entries;
}

// Group entries by the ISO week (Monday) of their introducedOn date.
function weekStart(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sun
  const diff = (day === 0 ? 6 : day - 1) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function weekKey(dateStr: string): string {
  return weekStart(dateStr).toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type ReleaseGroup = { weekStart: string; entries: Entry[] };

function groupByRelease(entries: Entry[]): ReleaseGroup[] {
  const byWeek = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = weekKey(entry.introducedOn);
    const bucket = byWeek.get(key) ?? [];
    bucket.push(entry);
    byWeek.set(key, bucket);
  }
  const groups: ReleaseGroup[] = [];
  for (const [weekStartStr, bucket] of byWeek) {
    bucket.sort((a, b) => b.introducedOn.localeCompare(a.introducedOn));
    groups.push({ weekStart: weekStartStr, entries: bucket });
  }
  groups.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  return groups;
}

const CHANGE_TYPE_LABEL: Record<Entry["changeType"], string> = {
  feature: "Feature",
  fix: "Fix",
  breaking: "Breaking",
  refactor: "Refactor",
  chore: "Chore",
};

export async function ChangelogContent() {
  const entries = await loadEntries();
  if (entries.length === 0) {
    return (
      <p className="text-fd-muted-foreground">
        No changelog entries yet. Entries are added when template changes that affect downstream
        storefronts land.
      </p>
    );
  }

  const releases = groupByRelease(entries);

  return (
    <div className="flex flex-col gap-12">
      {releases.map((release) => (
        <section key={release.weekStart} className="flex flex-col gap-6">
          <header className="flex flex-col gap-1 border-b border-fd-border pb-3">
            <h2 className="text-xl font-semibold">Week of {formatDate(release.weekStart)}</h2>
            <p className="text-sm text-fd-muted-foreground">
              {release.entries.length} {release.entries.length === 1 ? "change" : "changes"}
            </p>
          </header>
          <div className="flex flex-col gap-10">
            {release.entries.map((entry) => (
              <article key={entry.changeKey} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-lg font-semibold">{entry.title}</h3>
                  <span className="rounded bg-fd-muted px-1.5 py-0.5 text-xs font-medium text-fd-muted-foreground">
                    {CHANGE_TYPE_LABEL[entry.changeType]}
                  </span>
                  {entry.pr > 0 ? (
                    <a
                      href={`https://github.com/vercel/shop/pull/${entry.pr}`}
                      className="text-sm text-fd-muted-foreground underline-offset-4 hover:underline"
                    >
                      #{entry.pr}
                    </a>
                  ) : null}
                  <span className="text-sm text-fd-muted-foreground">
                    {formatDate(entry.introducedOn)}
                  </span>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <Streamdown>{entry.body}</Streamdown>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
