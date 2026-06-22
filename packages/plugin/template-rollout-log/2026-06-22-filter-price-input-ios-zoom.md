---
title: Collection filters — bump price-range input text to 16px on mobile (prevent iOS focus-zoom)
changeKey: filter-price-input-ios-zoom
introducedOn: 2026-06-22
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/collections/filter-primitives.tsx
relatedSkills: []
---

## Summary

`FilterPriceRange` (the from/to price inputs in the collection/search filters) rendered its `<input>`s at a flat `text-sm` (14px). The shared `Input` primitive already ships the shadcn anti-zoom pattern — `text-base md:text-sm` (16px on mobile, 14px on desktop) — but the local `text-sm` override flattened it back to 14px at every breakpoint.

- Dropped the `text-sm` class from both price `<input>` overrides so they inherit the base `Input`'s `text-base md:text-sm`.
- Matched the `$` currency-symbol `<span>`s to `text-base text-muted-foreground md:text-sm` so the prefix and the typed value read at one size per breakpoint.

No element box sizes change — the `h-8` pill, `h-auto` input, and `px-1` padding are untouched. Only the font-size per breakpoint changes.

## Why it matters

- iOS Safari auto-zooms the viewport when a focused form control's font-size is **under 16px**. At 14px, tapping a price input zoomed the whole page and left it zoomed. 16px is the hard threshold — 15px still zooms — so 16px is the smallest text that avoids it.
- On desktop (md+) the inputs stay at 14px, so the filter UI looks identical to before; the bump is mobile-only.

## Apply when

- The storefront uses the template's `FilterPriceRange` largely as shipped and serves a Shopify price-range facet on collection/search pages.

## Safe to skip when

- The price inputs were already restyled downstream to `text-base`/16px on mobile (or the price facet is disabled entirely).

## Validation

1. `pnpm --filter template lint`.
2. On a collection with a price facet at a mobile width, the price `<input>` computes to `font-size: 16px` (`md:` ≥768px → 14px). Tapping it on a real iOS device no longer zooms the page.

## See also

- `components/ui/input.tsx` — the base `Input` whose `text-base md:text-sm` pattern these inputs now inherit.
