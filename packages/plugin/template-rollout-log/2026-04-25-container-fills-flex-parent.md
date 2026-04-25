---
title: Search page skeleton fix and Container fills flex parent
changeKey: search-skeleton-and-container-w-full
introducedOn: 2026-04-25
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/ui/container.tsx
  - apps/template/app/search/page.tsx
  - apps/template/components/search/results.tsx
  - apps/template/lib/i18n/messages/en.json
---

## Summary

Two related fixes for the `/search` loading state:

1. `Container` (`components/ui/container.tsx`) now sets `w-full` alongside `mx-auto`. Previously, when `Container` was used inside a flex column (e.g. the root `<main className="flex flex-1 flex-col min-w-0">`), the auto margins overrode the default `align-items: stretch` and the section shrank to fit its children's intrinsic width. Real product cards forced the grid wide via image intrinsics, hiding the bug — but Suspense fallback skeletons have no intrinsic width, so the entire skeleton collapsed into a narrow strip.
2. The search page's h1 is now hoisted out of the Suspense boundary. The static prefix ("Search") renders immediately, and a nested `<Suspense fallback={null}>` resolves the search-params promise to append ` for "{query}"`. This means the page never flashes "All Products" before settling on the real title. `ResultsSkeleton` no longer takes a `title` prop. New i18n key `search.forQuery` replaces the now-removed `search.titleQuery`; `search.title` was also retitled from "All Products" to "Search".

## Why it matters

The previous fallback rendered "All Products" as the h1 even when a query was present, then snapped to "Search results for \"…\"" once data resolved. The skeleton beneath also collapsed because of the Container bug. After the fix, the title is consistent across loading and loaded states, and the skeleton fills the full grid.

## Apply when

- The storefront still uses `components/ui/container.tsx` with `mx-auto` and no width class.
- The storefront still uses the original `/search` page structure where the h1 lives inside the outer Suspense boundary.

## Safe to skip when

- `Container` has been customized to set its own width or has been replaced.
- The search page has already been restructured or replaced with a different layout that doesn't share these issues.

## Validation

- Visit `/search?q=beds` and confirm the loading skeleton spans the full container width with the configured grid columns.
- Confirm the loaded h1 reads `Search for "beds"` and `/search` (no query) reads `Search`.
- Confirm the loaded grid still renders identically.
