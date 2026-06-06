---
title: PDP — only show the active value next to the picker label when values aren't visible inline
changeKey: pdp-picker-active-value-display
introducedOn: 2026-06-06
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/option-picker.tsx
  - apps/template/components/product-detail/color-picker.tsx
---

## Summary

Both pickers previously rendered a `Name: Value` heading echoing the active variant's value. For the text-button `OptionPicker` that value is redundant — the selected value is already legible as the highlighted button. The redundancy only earns its place when the chooser itself doesn't spell out the value.

The active value now shows next to the label only when the values aren't visible inline:

- `OptionPicker` (text buttons): heading is now just `Name` (e.g. `Size`). The selected value reads off the highlighted button.
- `ColorPicker`: heading keeps `Name: Value`, since a color square doesn't name itself.
- Single-value options (the label-only row from `pdp-single-value-option-labels`): unchanged — still `Name: Value`, the only place that value appears.

The same "is the value visible inline?" principle drives the per-value label inside `ColorPicker`. A value rendered as an **image thumbnail** keeps its text label underneath; a value rendered as a **color square** drops it. The label is gated on `imageUrl` being truthy (`value.swatch.image` or the variant's product image, and not `hideImages`), so a mixed option shows labels under its image values and bare squares for its color values. The `aria-label` on each link/span already carries the value name, so dropping the visible label doesn't cost accessibility.

## Why it matters

- Removes a redundant readout above button pickers; the highlighted button is the source of truth.
- Keeps the value visible where the chooser can't convey it (color squares), preserving the quick "Color: Sage" readout.
- Makes the per-swatch label rule legible: text under a swatch means "this square is an image"; a bare square means "read the heading."

## Apply when

- The storefront still uses `components/product-detail/option-picker.tsx` and `color-picker.tsx` largely as shipped.

## Safe to skip when

- The storefront has its own picker markup or deliberately wants the active value echoed above every chooser.

## Validation

1. `pnpm --filter template dev`.
2. PDP with a text-button option (e.g. `Size`): heading reads `Size` with no value; the selected size is the highlighted button.
3. PDP with a color option backed by **color swatches**: heading reads `Color: <value>`, swatches render as bare squares with no text labels.
4. PDP with a color option backed by **swatch/variant images**: heading reads `Color: <value>` and each thumbnail keeps its text label underneath.
5. Single-value non-Title option (e.g. `Finish: Natural White Oak`): unchanged — still renders as the inline `Name: Value` label.

## See also

- `pdp-single-value-option-labels` (2026-06-02) — the single-value label row that this entry leaves intact.
