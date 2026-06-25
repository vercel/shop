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

function report(level, file, message) {
  findings.push({ level, file: relative(root, file), message });
}

for (const file of files) {
  const source = readFileSync(file, "utf8");
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

  if (
    /export\s+const\s+prefetch\s*=\s*["']allow-runtime["']/.test(source) &&
    !/export\s+const\s+instant\s*=\s*true/.test(source)
  ) {
    report("review", file, "Runtime prefetching is enabled without instant-navigation validation.");
  }

  for (const tag of source.matchAll(/<Image\b[\s\S]*?>/g)) {
    const value = tag[0];
    if (/\bfill\b/.test(value) && !/\bsizes\s*=/.test(value)) {
      report("review", file, "An <Image fill> tag has no sizes prop.");
    }
    if (/\bpriority(?:\s|=|\/|>)/.test(value)) {
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
  `Scanned ${files.length} files for architecture hotspots: ${errors} error(s), ${reviews} review item(s).`,
);

process.exitCode = errors > 0 ? 1 : 0;
