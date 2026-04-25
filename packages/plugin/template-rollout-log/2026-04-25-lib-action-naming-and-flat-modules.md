---
title: Lib cleanup — singular action.ts, search action moves home, flatten single-file lib dirs
changeKey: lib-action-naming-and-flat-modules
introducedOn: 2026-04-25
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/collections/action.ts
  - apps/template/lib/search/action.ts
  - apps/template/lib/utils.ts
  - apps/template/lib/product.ts
  - apps/template/components/collections/results-grid.tsx
  - apps/template/components/search/results.tsx
---

## Summary

Two small convention fixes in `lib/`. No behavior changes — pure rename + relocation.

1. **Action filename normalized to singular `action.ts`.**
   - `lib/collections/actions.ts` → `lib/collections/action.ts`
   - `lib/search/action.ts` was already singular; `lib/cart/action.ts` set the precedent.

2. **`loadMoreSearchProducts` moves to `lib/search/action.ts`.**
   - Previously lived in `lib/collections/actions.ts` alongside `loadMoreCollectionProducts`. It's a search action and belongs in the search domain folder. `lib/collections/action.ts` now exports only `loadMoreCollectionProducts`.

3. **Single-file `lib/utils/` and `lib/product/` directories collapsed to flat files.**
   - `lib/utils/index.ts` → `lib/utils.ts`
   - `lib/product/index.ts` → `lib/product.ts`
   - The directory wrapper added no value — both contained only `index.ts` — and the rest of `lib/` is flat for files of this kind (`lib/types.ts`, `lib/seo.ts`, `lib/config.ts`, `lib/params.ts`).
   - Importers don't change: `@/lib/utils` and `@/lib/product` resolve to the flat `.ts` file the same way they resolved to `dir/index.ts`.

## Why it matters

- One place to look for any given server action, named consistently across cart / collections / search.
- Fewer "why is there a directory here" pauses when reading `lib/`.
- Sets up the singular `action.ts` convention so future server actions land in the right place by default.

## Apply when

- The storefront still uses `lib/collections/actions.ts` and the original layout of `lib/utils/` / `lib/product/`.
- The storefront imports server actions from those paths and hasn't already split things its own way.

## Safe to skip when

- The storefront has restructured `lib/` for a different domain model (e.g. consolidated all server actions under `lib/actions/`).

## Validation

1. Pull the change and run `pnpm --filter template lint` and `pnpm --filter template build`. No errors should reference the old paths.
2. Visit `/collections/[handle]` and scroll past the first page — confirm `loadMoreCollectionProducts` still fetches additional products.
3. Visit `/search?q=...` and scroll past the first page — confirm `loadMoreSearchProducts` still fetches additional products.
4. Verify no callers still import from the removed paths:
   - `git grep "@/lib/collections/actions"` → no results
   - `git grep "@/lib/utils/index" "@/lib/product/index"` → no results
