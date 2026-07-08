---
title: PDP variant picker — outline tiers (light-gray available, dashed unavailable)
changeKey: pdp-variant-picker-outline-tiers
introducedOn: 2026-07-08
changeType: fix
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/option-picker.tsx
---

## Summary

Restyled the PDP text option picker (`option-picker.tsx`) from a solid selected fill to an outline three-tier ramp:

- **Selected** — solid `foreground` (near-black) border + text, `font-medium`.
- **Available** (unselected) — solid, light `border`-toned pill with `muted-foreground` text that darkens toward the selected treatment on hover.
- **Unavailable** — **dashed** `border` with lighter, struck-through text and `cursor-not-allowed`, rendered as an inert `<span>`.

The pills moved from `inset-ring` (a box-shadow, which can't render dashed) to a real 1px `border`. All three tiers share the same border width so pill geometry never shifts between states, and the invisible medium-weight twin still reserves the selected width. When the selection resolves, only the selected pill animates: `starting:border-border starting:text-muted-foreground` (CSS `@starting-style`) eases it up from the neutral border/text into the active near-black on the same `transition-all` the hover uses, so the highlight comes to life instead of popping. The other pills render at their final state with no entrance animation.

## Why it matters

The previous solid `bg-primary`/white-text selected state popped hard when the streamed picker highlight resolved on hydration. The border-only treatment makes that hydration handoff read as a subtle change rather than a fill swap, and the solid-vs-dashed distinction communicates availability without a heavy strikethrough-on-fill.

Note: the picker deliberately does **not** eagerly seed a selection in its Suspense fallback — the highlight appears only after the options promise resolves, so switching options never flashes the default value first. That behavior is unchanged by this entry; only the visual tiers changed.

## Apply when

- The storefront still uses `components/product-detail/option-picker.tsx`.
- You want the outline look, or the softer hydration handoff on variant PDPs.

## Safe to skip when

- The picker has been restyled downstream (a custom selected fill / brand treatment) — this would overwrite it.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit`.
2. On a multi-option PDP, the selected value shows a solid near-black border; other in-stock values a light solid border that darkens on hover.
3. An out-of-stock value renders with a dashed border, lighter struck-through text, non-clickable, with `cursor-not-allowed`.
