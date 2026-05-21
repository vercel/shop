---
title: Eager-load every desktop PDP grid tile instead of just the first two
changeKey: pdp-eager-grid-tiles
introducedOn: 2026-05-21
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-media.tsx
---

## Summary

In the desktop 2×2 PDP gallery (`<Grid>` and `<ColorImageGrid>`), only tile 0 was `priority` and tile 1 was `loading="eager"` — tiles 2 and 3 fell through to `loading="lazy"`. All four are reliably above the fold on desktop, so the bottom row visibly popped in after the top row. This change marks every non-priority desktop tile as `eager`, so the browser starts all four fetches with the first paint instead of waiting for the lazy-loading intersection trigger.

Mobile `<Carousel>` and `<ColorImageCarouselItems>` stay unchanged — they're snap-scroll one-at-a-time, so off-screen lazy is still correct there.

## Why it matters

LCP-style flicker on the lower half of the gallery. The 2×2 grid layout makes the "first 4 images" a single ATF unit; treating them as lazy was a residual mobile-first heuristic that didn't fit the desktop layout.

## Apply when

Storefront still uses the template `<Grid>` / `<ColorImageGrid>` for its PDP media. No data changes; only the loading hints on the `<Image>`.

## Safe to skip when

Fork has replaced `ProductMedia` with a custom gallery.

## Validation

`pnpm --filter template dev` → PDP on desktop. The bottom row of the 2×2 gallery should render with the top row, not after it. Mobile carousel still loads one tile then lazies the rest as you swipe.
