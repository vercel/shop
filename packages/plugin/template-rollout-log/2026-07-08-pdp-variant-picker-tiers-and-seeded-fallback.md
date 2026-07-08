---
title: PDP variant picker — outline tiers + seed the streamed fallback with the default selection
changeKey: pdp-variant-picker-tiers-seeded-fallback
introducedOn: 2026-07-08
changeType: fix
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/option-picker.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
---

## Summary

Two related changes to the text option picker on the PDP:

1. **Restyled the pills as an outline three-tier ramp** (`option-picker.tsx`). Selected went from a solid `bg-primary`/`text-primary-foreground` fill to a solid `foreground` (near-black) border + text. In-stock but unselected values use a solid, light `border`-toned pill with `muted-foreground` text that darkens toward the selected treatment on hover. Unavailable values use a **dashed** `border` with lighter, struck-through text and `cursor-not-allowed`. The pills moved from `inset-ring` (a box-shadow, which can't render dashed) to a real 1px `border`; all three tiers share the same border width so pill geometry never shifts between states, and the invisible medium-weight twin still reserves the selected width.
2. **Seeded the streamed picker's Suspense fallback with the default selection** (`product-detail-section.tsx`). The multi-variant fallback previously rendered `selectedOptions={{}}` (nothing highlighted); it now renders `defaultSelectedOptions(product)`.

## Why it matters

The picker highlight resolves off a fast `searchParams`-only promise, but the fallback showed *no* selection until it resolved — so on every multi-variant PDP load a pill popped from unselected into a solid black fill. Seeding the fallback with the default selection makes the common no-params load resolve to **no visual change**; a deep link to a non-default variant now shifts the highlight by one pill instead of materializing a selection from nothing. The softer outline selected state makes even that shift subtle rather than a fill swap.

## Apply when

- The storefront still uses `components/product-detail/option-picker.tsx` and the streamed option picker in `product-detail-section.tsx`.
- You want the default-outline look, or specifically the reduced highlight pop on variant PDPs.

## Safe to skip when

- The picker has been restyled downstream (e.g. a custom selected fill / brand treatment) — the tier restyle would overwrite it. The fallback-seeding change is independent and safe to take on its own even then.
- The store is single-variant only (products take the eager, non-streamed path, which already renders the default selection).

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit`.
2. On a multi-option PDP with no query params, the default option is highlighted immediately and does not change as the page settles.
3. Deep-linking `?size=…` to a non-default value moves the highlight to that pill without a flash of nothing-selected.
4. An out-of-stock value renders with a dashed border, lighter struck-through text, non-clickable, with `cursor-not-allowed`.
