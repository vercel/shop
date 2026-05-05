---
title: Route /search through the Storefront `search` field for full ProductFilter support
changeKey: search-via-storefront-search-field
introducedOn: 2026-05-05
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/components/search/results.tsx
  - apps/template/app/md/search/route.ts
  - apps/template/lib/search/action.ts
---

## Summary

`/search` (HTML and `/md/search`) and the search infinite-scroll action now go through the Storefront `search` field instead of `products(...)`. `searchIndexProducts` is generalized to accept `query?`, `collection`, `cursor`, `filters`, and to return `pageInfo`. `getCatalogProducts` is unchanged and remains in place for any other catalog/browse callers.

The fix:

- `PRODUCTS_SEARCH_QUERY` adds `productFilters: [ProductFilter!]` and forwards it to `search(...)`.
- Empty queries become `*` so plain `/search` browse still returns all products.
- `collection` is encoded into the query string as `collection:'…'` (same shape `getCatalogProducts` used).
- The search sort dropdown was already restricted to `SearchSortKeys`-compatible options (RELEVANCE, PRICE), so no user-visible sort capability is lost.
- The agent `searchProductsTool` caller is unaffected — it only reads `products`/`total`.

## Why it matters

`QueryRoot.products(query: …)` only understands a small set of query-string filters: `vendor:`, `product_type:`, `tag:`, `available_for_sale:`, and `variants.price:`. Variant options and metafields are silently dropped. Symptom: `?filter.v.option.color=pink` (or any size, gender, custom option) and `?filter.p.m.{ns}.{key}=…` updated only the facet sidebar counts but did not actually filter the result grid. After this change those filters work end-to-end on `/search`, both with and without a `q` query.

## Apply when

- The storefront uses the bundled `/search` page (`components/search/results.tsx`) or the `/md/search` route, and exposes any variant-option or metafield filters in the sidebar — i.e. anything beyond vendor/type/tag/availability/price.

## Safe to skip when

- The storefront has already replaced the search data path with a custom search backend (Algolia, Searchanise, etc.).
- The storefront only exposes vendor/type/tag/availability/price filters on `/search`. The bug never affected those paths because `getCatalogProducts` already encoded them into the query string.

## Notes

- This does not touch the collection PLP, which uses `Collection.products(filters: …)` and was never affected.
- `getCatalogProducts` stays exported for callers that genuinely want the relevance-ranked `products(...)` browse (used by `app/products/[handle]/page.tsx` and `components/product/products-grid.tsx`).

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` clean.
2. `pnpm --filter template dev`. With the demo catalog:
   - `/search?filter.v.option.color=pink` (no `q`) — result grid is filtered to pink products.
   - `/search?q=shirt&filter.v.option.color=pink` — filtered by both query and color.
   - `/search?q=shirt&filter.v.option.size=L` — filtered by size.
   - `/search?q=shirt&filter.p.vendor=…` — still works (parity).
   - `/search` with no params — browses all products.
   - Infinite scroll on `/search` — keeps active filters across pages.
   - `/md/search?filter.v.option.color=pink` — markdown matches the HTML page.
3. Agent `searchProducts` tool still returns results.
