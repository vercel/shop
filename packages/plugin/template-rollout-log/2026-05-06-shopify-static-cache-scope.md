---
title: Shopify static reads — use local cache unless query shape is high-cardinality
changeKey: shopify-static-cache-scope
introducedOn: 2026-05-06
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/menu.ts
  - apps/template/lib/shopify/operations/sitemap.ts
---

## Summary

Stable Shopify read operations now use vanilla `"use cache"` with `cacheLife("max")` and existing cache tags instead of `"use cache: remote"`. Search/filter/sort/cursor product flows remain on `"use cache: remote"`, and catalog products are split into `getCatalogProducts()` for static browse calls and `getFilteredCatalogProducts()` for high-cardinality filtered calls.

## Why it matters

- Static PDP, PLP, menu, sitemap, collection, recommendation, and batch product reads behave like ISR-style cache entries without relying on the remote runtime cache.
- Filtered catalog requests keep using the remote cache path because their query, filter, sort, and cursor combinations can create many distinct cache entries.

## Apply when

- The storefront has Shopify operations with stable inputs such as product handle, collection handle, locale, or a small fixed limit.
- Catalog browse calls do not pass query, collection, sort, cursor, or filter params.

## Safe to skip when

- An operation depends on request-time search params, arbitrary filters, sort options, or pagination cursors.
- The storefront intentionally wants a high-cardinality operation stored in the Vercel Runtime Cache.

## Validation

1. Run `pnpm --filter template lint`.
2. Run `pnpm --filter template build`.
3. Check filtered/search surfaces still call the remote-cache operation path when they pass high-cardinality params.
