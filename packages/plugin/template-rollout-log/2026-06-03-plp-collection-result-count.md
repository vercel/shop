---
title: Collection PLP — surface filter-aware result count in the toolbar
changeKey: plp-collection-result-count
introducedOn: 2026-06-03
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/collections/server.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/components/collections/collection-page.tsx
---

## Summary

`/collections/[handle]` now shows the same toolbar item count that `/search` and `/collections/all` already render ("N Items", hidden on mobile via the existing `hidden sm:flex` in `CollectionToolbar`). The count reflects active filters.

Concretely:

- `CollectionResultsData` gains a top-level `total: number`.
- `getCollectionResultsData` runs `getCollectionProducts(...)` and `getSearchFacets({ collection: handle, ... })` in parallel and threads `facets.total` into `total`. `getAllProductsResultsData` does the same with the `facets` it was already awaiting.
- `getSearchFacets` now also calls `cacheTag(\`collection-${collection}\`)` when given a collection handle, mirroring `getCollectionProducts` so a collection-scoped webhook invalidation busts the count alongside the product list.
- `CollectionDetailPage` wires a Suspense'd `<CollectionResultCount>` into the toolbar's `resultCount` slot, mirroring `app/search/page.tsx`'s `SearchResultCount`. The fallback is a `Skeleton className="h-4 w-20"` so the toolbar row doesn't shift when the count streams in.
- The dead `getExactCollectionResultCount` helper is removed (only useful when the entire collection fit on one page; superseded by the real total).

## Why it matters

The Storefront API's `collection.products` connection has no `totalCount`, which is why the count was previously absent. The top-level `search` field does expose `totalCount` and accepts `productFilters`, so routing a `collection:'<handle>'` query through it (which `getSearchFacets` already encodes) yields a filter-aware total. Reusing the existing helper keeps the data layer DRY and means `/search`, `/collections/all`, and `/collections/[handle]` now all source their counts from the same operation.

The cache-tag fix to `getSearchFacets` is independently useful — any future caller that scopes facets to a collection now benefits from precise webhook invalidation.

## Apply when

- The storefront still uses `CollectionToolbar` and `CollectionDetailPage` largely as shipped.
- The storefront's catalog is search-indexed by Shopify (the default — rules-based and most manual collections).

## Safe to skip when

- The storefront has replaced the PLP toolbar with a custom layout that already shows a count from its own source.
- The storefront uses manually curated collections containing products that are intentionally excluded from the search index. In that case the search-derived total can drift slightly from the connection-derived grid; either keep the count off, or replace `getCollectionProducts` with a `search(query: "collection:handle")` call (loses `COLLECTION_DEFAULT` ordering).

## Validation

1. `pnpm --filter template dev`. Visit a `/collections/[handle]` with > 20 products and confirm "N Items" renders in the toolbar on desktop and is hidden on mobile.
2. Apply a filter via URL (`?filter.v.availability=1`) or the sidebar; confirm the count updates and the Skeleton placeholder briefly holds the row height during the transition.
3. Confirm `/collections/all` and `/search` still render counts unchanged.
4. `pnpm --filter template lint` / `pnpm --filter template format --check` are clean.
