---
title: Uncache browse-grid pagination to fix boundary duplicates
changeKey: uncached-browse-pagination
introducedOn: 2026-06-20
changeType: fix
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/collections/server.ts
  - apps/template/lib/collections/action.ts
  - apps/template/lib/search/action.ts
  - apps/template/components/search/results.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/docs/content/docs/anatomy/pages/plp.mdx
---

## Summary

The browse/search product grid now reads its ordered product list **live** (uncached) instead of from the shared Runtime Cache, fixing a product that duplicated at the infinite-scroll page boundary.

- The two cursor-paginated operations in `lib/shopify/operations/products.ts` are split into an uncached inner fetch plus a thin cached wrapper, mirroring the existing `fetchCatalogProducts` / `getCatalogProducts` pattern:
  - `fetchCollectionProducts` (uncached) + `getCollectionProducts` (`"use cache: remote"` wrapper).
  - `fetchSearchIndexProducts` (uncached) + `searchIndexProducts` (`"use cache: remote"` wrapper).
- The browse/search surfaces call the uncached inner fetches: `getCollectionResultsData` and `getAllProductsResultsData` (`lib/collections/server.ts`), `getSearchResultsData` (`components/search/results.tsx`), and both load-more actions (`loadMoreCollectionProducts`, `loadMoreSearchProducts`).
- Facet aggregation (`getSearchFacets`) and the collection header (`getCollection`) stay cached. On `/collections/[handle]` the facet counts ride along inside the same now-live product query; `/collections/all` and `/search` keep facets in the separately-cached `getSearchFacets` read.
- The cached wrappers remain for the non-paginated consumers that still want caching: the `/md` content routes and the agent tools (`browse-collection`, `search-products`).
- `InfiniteProductGrid` gains a client-side dedup guard: a `seen` Set of product ids (seeded from the initial page, reset on filter/sort navigation) filters out any product a live cursor page re-emits.

## Why it matters

With both the first page and every load-more page cached under `"use cache: remote"` + `cacheLife("max")`, the two pages were independent snapshots taken at different times. The first page's cached `endCursor` was computed against one ordering; the page-2 fetch resolved that cursor against a different cached ordering. Because the Storefront `search` field's default sort is not perfectly stable, a drift between the two long-lived snapshots made the `after` cursor re-emit the boundary item. This reproduced live on `template.vercel.shop/collections/all`: page 1 ended with a product that page 2 then repeated as its first card (81 cards rendered, 80 unique). `shopifyFetch` sets no fetch-level caching, so under `cacheComponents` the `"use cache"` directive was the only thing caching these reads — dropping it from the paginated path makes consecutive pages come from consistent, near-simultaneous snapshots.

## Apply when

- Your storefront uses the template's infinite-scroll PLP/search grid and your catalog ordering can change (restocks, best-selling re-ranking, publishes) while shoppers browse.
- You have seen — or want to preempt — duplicate or skipped products across the page boundary.

## Safe to skip when

- Your catalog ordering is effectively static, or you have replaced the infinite-scroll grid with offset/page-number pagination.
- You depend on the product-grid read being cached for cost/latency reasons and accept the occasional boundary duplicate (in that case, you can still adopt just the `InfiniteProductGrid` dedup guard, which masks the visible duplicate without changing caching).

## Adoption notes

- The change relies on the grid already streaming inside a `<Suspense>` boundary that transitively `await`s `searchParams` — that is what keeps the route's PPR shape intact when the read goes live (the shell still prerenders; only the grid streams from a live call). If your fork awaits the results data at the top of the page instead, make it dynamic (Suspense + `searchParams`, or `connection()`) before uncaching, or the build will reject uncached I/O outside a dynamic scope.
- Cost trade-off: every grid render now issues a live Storefront `collectionProducts` / `searchProducts` call. Facets and the header remain cached, so the additional load is one product query per render.
- The dedup guard keys on `product.id`; it suppresses duplicates but cannot recover a product that a ranking shift skips entirely — uncaching is what minimizes skips.

## Validation

1. Run `pnpm --filter template lint`, `pnpm --filter template build` (the build is the gate that confirms the now-live grid reads are accepted inside their Suspense boundaries under `cacheComponents`), and `pnpm --filter docs build`.
2. With the dev server running, scroll `/collections/all` past the first page and confirm the rendered product handles contain no duplicate at the page boundary (total === unique). Repeat on a `/collections/[handle]` page and `/search?q=...`.
3. With `DEBUG_SHOPIFY=true`, confirm a `collectionProducts` / `searchProducts` call fires on each grid render while `searchFacets` and the collection header are served from cache on repeat loads.
