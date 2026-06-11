---
title: Variant picker — replace 1px borders with box-shadow rings
changeKey: variant-picker-rings
introducedOn: 2026-06-11
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/color-picker.tsx
  - apps/template/components/product-detail/option-picker.tsx
---

## Summary

The PDP variant pickers move from 1px `border` hairlines to box-shadow rings, which anti-alias more smoothly on rounded corners.

- `option-picker.tsx`: pills drop `border` for `inset-ring`. Unselected stays a 1px `inset-ring-border` hairline (with `hover:inset-ring-foreground/50`); selected becomes a 2px `inset-ring-foreground` so the active value reads clearly instead of relying on a 1px contrast change.
- `color-picker.tsx`: the selected swatch previously drew an inset `ring-1 ring-foreground/50` directly on top of the swatch image's own 1px `border-foreground/10` at the same radius — two stacked hairlines rendered crunchy. The subtle edge moves to an `after:` overlay (`after:inset-ring after:inset-ring-foreground/10`) so a single shadow hairline draws above the image, and selection becomes `ring-2 ring-foreground ring-offset-2 ring-offset-background` outside the swatch so it never overlaps the artwork. The inner `<Image>`/color div lose their `rounded-lg border` (the wrapper's `overflow-hidden rounded-lg` already clips).

## Why it matters

- 1px CSS borders on `rounded-lg` corners render with visible stair-stepping, especially on low-DPI displays; box-shadow rings anti-alias cleanly.
- The color picker's overlapping hairlines (selection ring over image border) produced a double-edge moiré on selected swatches.
- The offset `ring-2` selection state is unambiguous at a glance and doesn't tint or crop the swatch artwork.

## Apply when

- The storefront uses the template's `OptionPicker` / `ColorPicker` largely as shipped.

## Safe to skip when

- The storefront has replaced the variant pickers with custom components or deliberately uses a different selection treatment.

## Validation

1. `pnpm --filter template dev`.
2. Open a PDP with both a color option and a text option (size). Confirm: selected swatch shows a 2px ring offset from the swatch with a single subtle inner hairline; selected pill shows a 2px inner ring; unavailable values still render dimmed/struck-through.
3. `pnpm --filter template lint` clean.
