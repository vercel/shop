---
title: Home products grid reads the same search-index path as /collections/all
changeKey: home-grid-matches-collections-all
introducedOn: 2026-06-23
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product/products-grid.tsx
  - apps/docs/content/docs/anatomy/pages/home.mdx
---

## Summary

The home page featured-products grid now fetches with `searchIndexProducts({ limit, locale })` instead of `getCatalogProducts({ limit, locale })`, so its first 8 products match the first products shown on `/collections/all`.

- `components/product/products-grid.tsx` (`ProductsGridContent`) swaps the import and call from `getCatalogProducts` to `searchIndexProducts`.
- Both are `"use cache: remote"` + `cacheLife("max")` + `cacheTag("products")` wrappers, so caching/revalidation behavior is unchanged.
- `getCatalogProducts` is left in place (still used by `app/products/[handle]/page.tsx`).

## Why it matters

The two surfaces previously used different Storefront APIs and different effective sorts:

- Home grid → `getCatalogProducts` → the `products` connection. Its default sort is `RELEVANCE`, but with no query string `fetchCatalogProducts` falls back to `BEST_SELLING`, so the home grid was best-selling ordered.
- `/collections/all` → `getAllProductsResultsData` → `fetchSearchIndexProducts` → the `search` field with `query: "*"`, default sort `RELEVANCE` (the wildcard query keeps it from falling back).

So the home grid's "top 8" did not correspond to the first 8 cards on `/collections/all`. Routing the home grid through `searchIndexProducts` (same `search` field, same `*` query, same `RELEVANCE` default) makes the home grid a true preview of that page.

## Apply when

- You want the home featured grid to be a consistent preview of `/collections/all` (e.g. the "view all" link should land on the same products the shopper just saw).

## Safe to skip when

- You deliberately want the home grid to surface best-selling products rather than the catalog's relevance ordering, or you curate the home grid from a specific collection.

## Validation

1. `pnpm --filter template lint`, `pnpm --filter template build`, `pnpm --filter docs build`.
2. With the dev server running, compare the first 8 product handles on `/` against the first 8 on `/collections/all` — they should match in the same order.
