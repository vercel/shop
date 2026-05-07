---
title: PDP color gallery fallback — reduce skeleton to one tile
changeKey: pdp-color-gallery-fallback
introducedOn: 2026-05-06
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

Color-partitioned PDP galleries now render a single desktop skeleton tile while the selected color image slot waits on `searchParams.variant`, matching the existing mobile behavior.

Shared/unassigned gallery media still renders immediately through `ProductMedia`; only the color-specific Suspense slot shows fallback UI.

## Why it matters

- Reduces the visible fallback on variant-image PDPs from a block of desktop gallery skeletons to the first dynamic image slot.
- Keeps the existing server-rendered `?variant=` navigation model without introducing variant-specific PDP routing.

## Apply when

- The storefront uses the template PDP gallery with color-based image partitioning.
- Users see multiple desktop gallery skeletons when opening a product URL with `?variant=`.

## Safe to skip when

- The storefront replaced `ProductMedia` or the color-partitioned gallery with a custom implementation.
- The custom gallery already limits search-param fallback UI to the dynamic image slot.

## Validation

1. Open a color-partitioned PDP with a `?variant=` query parameter on desktop and confirm only one gallery skeleton tile is visible before the color-specific media streams in.
2. Open the same PDP on mobile and confirm the carousel fallback remains one slide.
3. Open a PDP without color partitioning and confirm all gallery images render without this fallback path.
