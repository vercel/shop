---
title: Match the PDP buy-buttons Suspense fallback gap to the resolved component (no CLS on stream-in)
changeKey: pdp-buy-buttons-fallback-gap
introducedOn: 2026-06-15
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-section.tsx
---

## Summary

`BuyButtonsFallback` (the static-shell placeholder for the buy buttons) used `grid grid-cols-2 gap-2`, while the resolved `BuyButtons` uses `grid grid-cols-2 gap-2.5`. Both fallback branches now use `gap-2.5` so the placeholder and the streamed-in component lay out identically.

## Why it matters

The buy buttons stream inside a Suspense boundary keyed on `searchParams`, so the static shell paints the fallback first and the resolved component replaces it on hydration/stream-in. The 2px gap difference (`gap-2` → `gap-2.5`) re-flowed both grid columns by ~1px each at swap time — a small but visible horizontal layout shift on PDP load. Aligning the gap removes the shift; the fallback must match the resolved component on every layout-affecting property (gap, height, radius), not just appearance.

## Apply when

- Always, for any detail route where a Suspense fallback stands in for a component that streams into the static shell.

## Safe to skip when

- You don't use the buy-buttons Suspense fallback, or your fallback already shares its layout container with the resolved component.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build`.
2. Load a multi-variant PDP and watch the buy-buttons row as the dynamic content streams in — the two buttons should not shift width or position.
