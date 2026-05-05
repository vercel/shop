---
title: Fix /search and /collections infinite scroll — drop inline server action closure
changeKey: infinite-scroll-cipher-fix
introducedOn: 2026-05-05
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/components/collections/results-grid.tsx
  - apps/template/components/search/results.tsx
---

## Summary

`InfiniteProductGrid` is now generic over its load-more params: it takes a top-level `"use server"` action by reference (`loadMore`) and a serializable `loadMoreParams` prop, and calls `loadMore({ ...loadMoreParams, cursor })` from the client. The two consumers (`SearchResultsGridRender`, collections `Render`) drop their inline `boundLoadMore = async (cursor) => { "use server"; ... }` closures and pass `loadMoreSearchProducts` / `loadMoreCollectionProducts` directly.

## Why it matters

Inline `"use server"` actions defined inside an async server component encrypt their closed-over values into a bound-args blob. On Next.js 16 canary the cipher is failing on /search and /collections — the action returns HTTP 500 with `OperationError: Cipher job failed` underneath. Symptom: infinite scroll silently does nothing (the `try/finally` inside `InfiniteProductGrid` swallows the error). Users only ever see the first page (24 products).

A top-level server action passed as a prop is sent by reference and not subject to closure encryption, so the failure goes away.

## Apply when

- The storefront uses the bundled `InfiniteProductGrid` on `/search` or `/collections/<slug>`.

## Safe to skip when

- The storefront has replaced infinite scroll with cursor-URL pagination, or replaced `InfiniteProductGrid` with a custom client component that doesn't capture closures in a `"use server"` block.

## Notes

- `InfiniteProductGrid` is now `InfiniteProductGrid<TParams>`. Existing callers infer the type from `loadMoreParams`.
- The action signatures for `loadMoreSearchProducts` / `loadMoreCollectionProducts` are unchanged — they still take a single params object that includes `cursor`. Only the call site moved from server to client.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` clean.
2. `pnpm --filter template dev`. On `/search` and `/collections/<any>` scroll past the first 24 products — the next page loads in.
3. `curl` the action endpoint with a cursor and confirm HTTP 200 (no `Cipher job failed`).
