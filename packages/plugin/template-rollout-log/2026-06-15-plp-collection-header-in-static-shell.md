---
title: Render the PLP collection header in the static shell (await-at-top, no runtime re-render)
changeKey: plp-collection-header-in-static-shell
introducedOn: 2026-06-15
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/collections/[handle]/page.tsx
  - apps/template/app/collections/all/page.tsx
  - apps/template/components/collections/collection-page.tsx
  - apps/template/lib/collections/server.ts
  - apps/template/lib/shopify/operations/collections.ts
---

## Summary

The collection PLP now resolves the collection at the top of the page (`await params` + `await getCollection`) and renders the header — title, description, JSON-LD — directly, so it is baked into the **static prerender (shell)** as a single copy. Only the request-dependent UI (result count, filter sidebar, sort select, product grid) streams, inside its own Suspense boundaries keyed on `searchParams`. This applies the `pdp-product-body-in-static-shell` (2026-06-14) pattern to collections.

Coupled changes:

1. **`app/collections/[handle]/page.tsx`** — `await params`/`getCollection` at the top and pass the resolved `collection` + `handle` down (previously the collection promise was threaded into the header's `<Suspense>`). Drop `export const instant` / `export const prefetch = "allow-runtime"` — `allow-runtime` re-renders the whole tree at request time, re-introducing the tear.
2. **`app/collections/all/page.tsx`** — same shape for the virtual "all" collection: `await getAllProductsCollection()` at the top, pass it down, drop `instant`/`prefetch`.
3. **`components/collections/collection-page.tsx`** — `CollectionDetailPage` takes a resolved `collection: Collection` + `handle: string` instead of promises; the `<Suspense>`/skeleton around `CollectionHeader` is removed and the header renders synchronously from resolved data.
4. **`lib/shopify/operations/collections.ts`** — `getCollection` back to plain `"use cache"` (from `"use cache: remote"`). `remote` resolves at request time, _outside_ the static shell, so it does not bake in. This partially reverses `shopify-reads-remote-cache` (2026-06-13) for the collection-by-handle read only; `getCollections` (list), `getCollectionProducts`, and the facet reads are unchanged.

## Why it matters

Previously the collection header was rendered in **two** places: the frozen prerendered shell **and** a per-request RSC flight (because the data promise was threaded into `<Suspense>` and the route used `prefetch = "allow-runtime"`). When the cached value at request time differed from what was baked into the shell — which happens as the Runtime Cache entry evicts/refreshes independently of the full-route shell — the two copies disagreed, producing a **React hydration mismatch** and collection copy that appeared to **change on its own**.

Awaiting at the top puts the header in the shell as a single source; removing `allow-runtime` stops the request-time re-render. The header is then served from the frozen prerender in both the shell HTML and the flight, so they cannot diverge. The product grid still streams because it keys on request-time filter/sort/cursor inputs — that is genuinely dynamic, not part of the shell.

## Apply when

- Always, for collection (and similar) listing routes that mix a cached header/body with request-time inputs (`searchParams`). Resolve the cacheable metadata at the top so it lands in the static shell; reserve Suspense + streaming for the genuinely request-time parts (results, facets, sort).

## Safe to skip when

- The route is fully dynamic (no static shell) — e.g. `/search`, whose body is driven entirely by the query `searchParams`, so there is no cacheable body to bake and no two-copy split to reconcile.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build`.
2. Fetch a collection PLP and confirm the `<meta name="description">` (shell) and the streamed RSC flight carry the same title/description — no stale-shell/fresh-flight split, no hydration error in the browser console.
3. Edit a collection in Shopify, then drive traffic for a while: the page either holds the old value or updates to the new one, but never shows the shell and header disagreeing.
