---
title: Fix /collections/all pagination and populate filter facets
changeKey: collections-all-pagination-and-facets
introducedOn: 2026-05-21
changeType: bugfix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/collections/all/page.tsx
  - apps/template/components/collections/collection-page.tsx
  - apps/template/components/collections/results-grid.tsx
  - apps/template/lib/collections/server.ts
---

## Summary

`/collections/all` was returning 24 products and never loading more. The route's initial data came from `getFilteredCatalogProducts` (Storefront `products()` field), but `InfiniteProductGrid` was wired to `loadMoreCollectionProducts`, which calls `getCollectionProducts({ collection: "all" })` — a real-collection lookup. Shopify has no collection with handle `"all"`, so the load-more call short-circuited to `{ products: [], pageInfo: { hasNextPage: false } }` and pagination stopped after the first page.

The same route also returned `filters: []` and an empty `transformedFilters`, so the filter sidebar showed nothing.

Both are now fixed by aligning `/collections/all` with how `/search` already works:

- `getAllProductsResultsData` now calls `searchIndexProducts` + `getSearchFacets` in parallel (the same backend pair `/search` uses). Real facet counts populate `transformedFilters`.
- `results-grid.tsx` switches to `loadMoreSearchProducts` for the `ALL_PRODUCTS_HANDLE` case so load-more uses the cursor produced by the initial fetch.
- `/collections/[handle]` is unchanged — it still uses `getCollectionProducts` + `loadMoreCollectionProducts` because real Shopify collections have their own paginated products edge.

## Why it matters

`/collections/all` is the destination for "Shop all" navigation. A 24-product cap with no filters is a visible regression once the catalog grows past one page.

## Trade-off

Storefront's `search()` field only supports `RELEVANCE` and `PRICE` sort keys. `/collections/all` now hides `best-selling`, `date-new-to-old`, `date-old-to-new`, `product-name-ascending`, and `product-name-descending` from the sort dropdown — matching `/search`'s existing exclusion list. `/collections/[handle]` keeps the full set because it uses the collection-level `ProductCollectionSortKeys`.

If the storefront needs those sort options on the all-products page, the alternative is to back `/collections/all` with `products()` (which supports the full sort set) and call `getSearchFacets` separately for facet counts. The caveat is that `products()` silently drops `variantOption` and `productMetafield` filters at the backend, so applying those filter types on the all-products page would show counts but not actually filter products. Pick whichever trade-off matches the storefront's filter set.

## Apply when

Storefront has a `/collections/all` page (added 2026-05-20) and wants pagination + filters to work there.

## Safe to skip when

Storefront has replaced `/collections/all` with a custom virtual-collection implementation.

## Validation

1. `pnpm --filter template build` and `pnpm --filter template lint` clean.
2. `pnpm --filter template dev`. Visit `/collections/all`:
   - Scroll to the bottom of the initial 24-product grid; the next page loads.
   - The filter sidebar shows real facets (availability, product type, price, etc.).
   - The sort dropdown shows only the search()-compatible options (best-matches, price-low-to-high, price-high-to-low).
3. Visit `/collections/frontpage` and confirm its sort dropdown still shows the full set (collection-level sort keys are unaffected) and pagination still works.
