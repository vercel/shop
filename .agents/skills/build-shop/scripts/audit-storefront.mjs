#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(process.argv[2] ?? process.cwd());
const sourceRoots = ["app", "components", "src/app", "src/components"]
  .map((path) => join(root, path))
  .filter(existsSync);

if (sourceRoots.length === 0) {
  console.error(`No app or components directories found under ${root}`);
  process.exit(1);
}

const files = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
    } else if ([".jsx", ".tsx"].includes(extname(path))) {
      files.push(path);
    }
  }
}

for (const directory of sourceRoots) walk(directory);

const findings = [];
const sharedLinkFiles = ["components/ui/link.tsx", "src/components/ui/link.tsx"].filter((path) =>
  existsSync(join(root, path)),
);

function report(level, file, message) {
  findings.push({ level, file: relative(root, file), message });
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

for (const file of files) {
  const source = stripComments(readFileSync(file, "utf8"));
  const normalized = relative(root, file);

  if (/<img\b/.test(source)) {
    report(
      "error",
      file,
      "Native <img> found; use next/image unless this is an intentional exception.",
    );
  }

  if (/^["']use client["'];?/m.test(source) && /(^|\/)(page|layout)\.[jt]sx$/.test(normalized)) {
    report(
      "review",
      file,
      "A page or layout is a client boundary; verify that it cannot be pushed down.",
    );
  }

  if (/export\s+const\s+instant\s*=\s*false\b/.test(source)) {
    report(
      "review",
      file,
      "instant = false opts out of instant-navigation and static-shell validation; fix the blocking read with Suspense or cache instead.",
    );
  }

  if (/(^|\/)app\/(.*\/)?loading\.[jt]sx$/.test(normalized)) {
    report(
      "review",
      file,
      "Route skeleton lives in loading.tsx; keep an inline Suspense boundary with an aria-busy skeleton instead.",
    );
  }

  if (
    sharedLinkFiles.length > 0 &&
    !sharedLinkFiles.includes(normalized) &&
    /from\s+["']next\/link["']/.test(source)
  ) {
    report(
      "review",
      file,
      "Imports next/link directly; internal links use the shared Link from components/ui/link.",
    );
  }

  for (const tag of source.matchAll(/<Image\b[\s\S]*?>/g)) {
    const value = tag[0];
    if (/\bfill\b/.test(value) && !/\bsizes\s*=/.test(value)) {
      report("review", file, "An <Image fill> tag has no sizes prop.");
    }
    if (/\spriority(?=\s*(?:=|\/?>|[A-Za-z{]))/.test(value)) {
      report(
        "review",
        file,
        "Image priority is deprecated in Next.js 16; choose preload, eager loading, or fetchPriority intentionally.",
      );
    }
  }
}

for (const finding of findings) {
  console.log(`${finding.level.toUpperCase()} ${finding.file}: ${finding.message}`);
}

const errors = findings.filter(({ level }) => level === "error").length;
const reviews = findings.length - errors;
console.log(
  `Scanned ${files.length} files for storefront hotspots: ${errors} error(s), ${reviews} review item(s).`,
);

process.exitCode = errors > 0 ? 1 : 0;
