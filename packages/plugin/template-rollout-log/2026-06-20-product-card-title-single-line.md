---
title: Product card title clamps to one line
changeKey: product-card-title-single-line
introducedOn: 2026-06-20
changeType: enhancement
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-card/components.tsx
---

## Summary

`ProductCardTitle` clamps to a single line instead of two (`line-clamp-2` → `line-clamp-1`), and `ProductCardSkeleton` drops its second title bar to match.

- `ProductCardTitle`: `line-clamp-2` → `line-clamp-1`. Long titles now truncate after one line with an ellipsis.
- `ProductCardSkeleton`: removed the second title bar and shrank the reserved content height from `h-18` to `h-12` so the skeleton footprint still matches a loaded card (one title line + price).

## Why it matters

- Tightens vertical rhythm in product grids and sliders: cards reserve less title space, so rows are shorter and more uniform regardless of title length.
- The skeleton height is kept in lockstep with the title-line count to avoid layout shift between the Suspense fallback / infinite-scroll placeholder and the loaded card.

## Apply when

- The storefront uses `ProductCardTitle` / `ProductCardSkeleton` as shipped and wants the tighter one-line title.

## Safe to skip when

- Product titles are long and benefit from two lines of context in the grid, or the card has been restyled with its own title treatment.

## Adoption notes

- If you keep two-line titles, leave `line-clamp-2` and the skeleton's `h-18` + second title bar in place — the two must move together to avoid layout shift.

## Validation

1. Open a product grid (home, collection, search) with a long-titled product and confirm the title truncates after one line.
2. Confirm the loading skeleton reserves the same height as the loaded card (no visible jump on hydration / infinite scroll).
3. `pnpm --filter template lint` clean.
