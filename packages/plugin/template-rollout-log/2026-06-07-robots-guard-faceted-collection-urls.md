---
title: Guard faceted collection URLs in robots
changeKey: robots-guard-faceted-collection-urls
introducedInVersion: 0.1.0
introducedOn: 2026-06-07
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/robots.ts
---

## Summary

Adds four `disallow` rules to `apps/template/app/robots.ts` that block crawlers from
sorted and filtered collection URLs:

```ts
"/collections/*?*sort=",
"/collections/*?*filter.",
"/*/collections/*?*sort=",
"/*/collections/*?*filter.",
```

Bare collection URLs (`/collections/<handle>`) stay crawlable; only `?sort=` and
`?filter.*` variants are blocked. The `*?*marker` shape matches the param in any query
position. Locale-prefixed variants (`/*/collections/...`) mirror the existing prefixed
rules for when Markets/i18n routing is enabled.

## Why it matters

Each sort option crossed with each filter value is a distinct URL serving near-duplicate
content. Left open, crawlers burn budget on thousands of permutations and dilute ranking
signals — the same crawl-explosion problem Shopify Hydrogen guards against. `/search` was
already fully disallowed, so collection facets were the remaining unguarded surface.

## Apply when

Storefront exposes sort/filter via `sort=` and `filter.*` query params on `/collections/*`
(the template default). This is the canonical faceting scheme in `lib/utils.ts` and
`lib/shopify/operations/products.ts`.

## Safe to skip when

Storefront has renamed the sort/filter query params, or intentionally wants faceted
collection URLs indexed (e.g. curated landing pages built on filter combinations) — in
that case adjust the param markers rather than dropping the rules wholesale.

## Validation

1. `pnpm --filter template lint` passes.
2. `pnpm --filter template build` succeeds.
3. `curl http://localhost:3000/robots.txt` shows the four new `Disallow:` lines under
   `User-agent: *`, with the `Sitemap:` line intact.
