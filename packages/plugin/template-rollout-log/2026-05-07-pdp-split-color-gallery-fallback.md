---
title: PDP color gallery fallback — split first image from remaining media
changeKey: pdp-split-color-gallery-fallback
introducedOn: 2026-05-07
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

Color-partitioned PDP galleries now split the selected-color media into two Suspense slots: the first image slot renders a single skeleton while `searchParams.variant` resolves, and the remaining selected-color media streams with no visible fallback.

Shared/unassigned media still renders immediately through `ProductMedia`.

## Why it matters

- Limits visible fallback UI to the dynamic first selected-variant image slot.
- Avoids showing skeleton placeholders for later selected-color images that are not immediate LCP candidates.
- Keeps the server-rendered `?variant=` navigation model without introducing variant-specific PDP routing.

## Apply when

- The storefront uses the template PDP gallery with color-based image partitioning.
- Users see multiple desktop gallery skeletons when opening a product URL with `?variant=`.

## Safe to skip when

- The storefront replaced `ProductMedia` or the color-partitioned gallery with a custom implementation.
- The custom gallery already separates the first variant-dependent media slot from the rest of the gallery.

## Notes

- `ColorImageGrid` and `ColorImageCarouselItems` now accept an optional `startIndex` so split rendering preserves image alt text, priority, and eager-loading semantics.

## Validation

1. Open a color-partitioned PDP with a `?variant=` query parameter on desktop and confirm only one gallery skeleton tile is visible before the first selected-color image streams in.
2. Confirm the remaining selected-color images appear after resolution without their own skeleton placeholders.
3. Open the same PDP on mobile and confirm the carousel fallback remains one slide.
4. Open a PDP without color partitioning and confirm all gallery images render without this fallback path.
