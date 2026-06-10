---
title: PDP — opt into runtime prefetch (prefetch = "allow-runtime")
changeKey: pdp-allow-runtime-prefetch
introducedOn: 2026-06-10
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
relatedSkills: []
---

## Summary

Add `export const prefetch = "allow-runtime"` to the PDP (`app/products/[handle]/page.tsx`), next to the existing `export const instant = true`. This matches the collection (`collections/[handle]`, `collections/all`) and `search` routes, which already export it.

The PDP previously exported only `instant = true` and no `prefetch`, so it defaulted to `prefetch: 'auto'` — a static prefetch. With `partialPrefetching: true` on globally, a static prefetch carries only the page's static shell. The PDP's product body awaits the (cached) `getProduct(handle)` inside `<Suspense>`, and `generateMetadata` resolves the per-product title/OG from the same dynamic-param lookup — both render in the runtime stage, not the shell. So on a client-side navigation the prefetch contained only the skeleton fallback and the default `<head>`, and neither filled in until a post-click server round-trip.

`prefetch = "allow-runtime"` makes the prefetch a runtime render. Because `getProduct` is `"use cache"` / `cacheLife("max")`, that prefetch resolves from cache and includes the product body **and** the resolved metadata, so client navigations land on real content with the correct title instantly.

## Why it matters

- Fixes the two PDP symptoms: the loading skeleton showing on every client-side navigation, and the product `<title>`/OpenGraph metadata never updating on soft navs (it only "streamed in" on hard loads).
- Brings the PDP in line with the other dynamic routes, which already opt into runtime prefetch.

## Apply when

- The storefront is on `next@16.3.0-canary.47`+ (the `instant` / `prefetch` route segment config — see `next-canary-47-instant-prefetch-stable`) with `partialPrefetching: true`.
- The PDP still awaits a cached `getProduct` inside `<Suspense>` and derives metadata from it, largely as shipped.

## Safe to skip when

- Still pinned to `16.3.0-canary.46` or earlier — the export names/values differ there (`unstable_prefetch` / `force-runtime`); adopt only with the canary.47 migration.
- The storefront wants to minimize runtime-prefetch volume. PDPs are linked from every product grid (home, collections, search), so `allow-runtime` issues one runtime prefetch per in-viewport product-card link. Each is a cheap cache hit thanks to `cacheLife("max")`, but it is more server prefetch traffic than a static prefetch — tune with `<Link prefetch>` if needed.

## Validation

1. `pnpm --filter template build` — `/products/[handle]` still reports Partial Prerender (◐) in the route table.
2. `pnpm --filter template dev`, then from the home/collection grid click into a product (client nav): no skeleton flash, and the document title is the product title immediately.
3. `grep -n 'export const prefetch' apps/template/app/products/[handle]/page.tsx` → `"allow-runtime"`.

## See also

- `next-canary-47-instant-prefetch-stable` (2026-06-09) — renamed the config and added `prefetch = "allow-runtime"` to collections/search, but not the PDP.
- `skeleton-fallback-color` (2026-06-09) — softened the fallback this change makes rarer on the PDP.
