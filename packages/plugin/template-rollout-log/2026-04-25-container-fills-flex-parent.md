---
title: Container always fills its flex parent
changeKey: container-w-full
introducedOn: 2026-04-25
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/ui/container.tsx
---

## Summary

`Container` (`components/ui/container.tsx`) now sets `w-full` alongside `mx-auto`. Previously, when `Container` was used inside a flex column (e.g. the root `<main className="flex flex-1 flex-col min-w-0">`), the auto margins overrode the default `align-items: stretch` and the section shrank to fit its children's intrinsic width.

## Why it matters

With real product cards, images forced the grid wide enough that the bug was invisible. The Suspense fallback skeleton has no intrinsic min-width, so on routes like `/search?q=...` the entire skeleton (toolbar + 5-column grid) collapsed into a narrow strip on the right of the page during the loading state.

## Apply when

- The storefront still uses `components/ui/container.tsx` with `mx-auto` and no width class.
- The storefront has Suspense fallbacks containing low-intrinsic-width skeletons (e.g. `ProductCardSkeleton`).

## Safe to skip when

- `Container` has already been customized to set its own width or has been replaced.

## Validation

- Open `/search?q=beds` (or any collection) and confirm the loading skeleton spans the full container width with the configured grid columns, not a narrow strip.
- Confirm the loaded state still renders identically.
