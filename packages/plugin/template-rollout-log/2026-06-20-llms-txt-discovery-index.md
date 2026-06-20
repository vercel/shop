---
title: llms.txt discovery index for AI agents
changeKey: llms-txt-discovery-index
introducedInVersion: 0.1.0
introducedOn: 2026-06-20
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/llms.txt/route.ts
  - apps/template/lib/markdown/llms.ts
relatedSkills: []
---

## Summary

Adds a `/llms.txt` route — a curated, machine-readable index of the storefront for AI
agents, following the [llmstxt.org](https://llmstxt.org) convention.

- `app/llms.txt/route.ts` — `GET` handler serving `text/plain` (`max-age=86400`,
  `stale-while-revalidate=604800`). Fetches up to 50 collections live from Shopify and
  degrades to an index-without-collections if the catalog query fails.
- `lib/markdown/llms.ts` — `llmsTxt({ collections, locale })` generator, same
  `sections: string[]` + `escapeMarkdown()` house style as the other `lib/markdown/`
  converters.

The file emits an H1 (site name), a summary blockquote pointing agents at the
`Accept: text/markdown` content negotiation, then `Browse` (all-products + search),
`Collections` (live catalog, capped), and `Discovery` (sitemap + robots) sections.

## Why it matters

`llms.txt` is becoming the canonical entry point AI agents and answer engines look for —
the agent-facing analog of `robots.txt`. It complements the existing AEO/GEO surfaces
(content negotiation, JSON-LD, sitemap) by giving agents a single curated map of the
catalog instead of forcing them to crawl. Pairs with the `/md/**` content-negotiation
routes the index links to.

## Apply when

The storefront wants to be discoverable to AI shopping agents and answer engines (the
template default). No configuration required; it reads `siteConfig` and live collections.

## Safe to skip when

The storefront intentionally blocks AI agents, or replaces the catalog browse model such
that a flat collection list is not a useful index (e.g. a single-product store).

## Validation

1. `pnpm --filter template lint` passes.
2. `curl http://localhost:3000/llms.txt` returns `200`, `Content-Type: text/plain`, with
   `# <Site Name>`, a `> ` summary line, and `## Browse` / `## Collections` / `## Discovery`
   sections.
3. Every link under `## Collections` resolves; fetching one with `Accept: text/markdown`
   returns Markdown (see the companion `collections-all-markdown-negotiation` entry for the
   `/collections/all` link specifically).
