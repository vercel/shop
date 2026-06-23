---
title: Uncache the search-facets read so /collections/all and /search show live filters
changeKey: uncached-search-facets
introducedOn: 2026-06-23
changeType: fix
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/collections/server.ts
  - apps/template/components/search/results.tsx
  - apps/docs/content/docs/anatomy/pages/plp.mdx
---

## Summary

Follows up `uncached-browse-pagination`. That change took the paginated **product** reads live but deliberately left the separate facet read (`getSearchFacets`) cached with `cacheLife("max")`. This change takes the facet read live too on the page surfaces, so `/collections/all` and `/search` show filters that reflect the store's current Search & Discovery config.

- `getSearchFacets` in `lib/shopify/operations/products.ts` is split into an uncached inner `fetchSearchFacets` plus the existing `"use cache: remote"` `getSearchFacets` wrapper — same split already used for `fetchCollectionProducts`/`getCollectionProducts` and `fetchSearchIndexProducts`/`searchIndexProducts`.
- The browse/search page reads call the uncached `fetchSearchFacets`: `getAllProductsResultsData` (`lib/collections/server.ts`) and `getSearchResultsData` (`components/search/results.tsx`).
- The cached `getSearchFacets` wrapper stays for the non-paginated consumers that still want caching: the `/md/search` content route (and the same pattern for any agent tools that read facets).

## Why it matters

`/collections/[handle]` already serves facets **live** — the counts ride along inside the now-uncached `collection.products(filters:){ filters }` query. Only `/collections/all` and `/search` fetched facets through the separate, long-lived `getSearchFacets` cache, which created two problems:

1. **Inconsistency** — the same conceptual filter list was live on `[handle]` but cached on `all`/`search`.
2. **Staleness** — `getSearchFacets` was `cacheLife("max")`, invalidated only by the `products` tag. Filter-shaping changes that do **not** fire a product webhook — enabling a filter in Search & Discovery, configuring swatches, a value set shifting — left the cached facet list wrong indefinitely. In practice this hid a newly enabled, swatch-presentation Color filter on `/collections/all` while it rendered correctly on `/collections/[handle]`.

The facet query is not paginated (single `search(query:"*", first:1)` aggregation), so it never had the cursor-drift bug that motivated uncaching products — it was kept cached purely for cost. Uncaching it costs one extra live Storefront query per render on `/collections/all` and `/search` (those routes are already dynamic for products), in exchange for correct, consistent filters.

## Apply when

- You adopted `uncached-browse-pagination` and want the filter sidebar on `/collections/all` and `/search` to reflect live filter config, or you have seen stale filters there (missing/extra filters, missing swatches) after changing Search & Discovery.

## Safe to skip when

- Your filter configuration is effectively static and you prefer to save the extra per-render facet query, or you have a webhook/`updateTag` path that already invalidates the facet cache on Search & Discovery changes.

## Adoption notes

- Relies on the same dynamic-scope precondition as `uncached-browse-pagination`: the grid/sidebar stream inside a `<Suspense>` boundary that transitively awaits `searchParams`, so the uncached facet read sits in a dynamic scope and the build accepts it under `cacheComponents`. `getAllProductsResultsData`/`getSearchResultsData` already issue an uncached product query in the same `Promise.all`, so this adds no new dynamic scope.

## Validation

1. `pnpm --filter template lint`, `pnpm --filter template build` (the build is the gate that confirms the uncached facet read is accepted inside its Suspense boundary), and `pnpm --filter docs build`.
2. With `DEBUG_SHOPIFY=true`, confirm a `searchFacets` call fires on each `/collections/all` and `/search` render (no longer served from cache on repeat loads), while `/md/search` still serves facets from cache.
3. Toggle a filter's display in Search & Discovery and confirm `/collections/all` reflects it on the next request without waiting for a product webhook or cache expiry.
