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
- `ColorPicker`: heading keeps `Name: Value`, since a swatch (color or image) doesn't name itself, and the per-value text caption under each swatch is removed entirely. The grid is now bare swatches/thumbnails with the active value shown only in the heading.
- Single-value options (the label-only row from `pdp-single-value-option-labels`): unchanged — still `Name: Value`, the only place that value appears.

`ColorPicker` no longer renders a caption under either color squares or image thumbnails. The `aria-label` on each link/span still carries the value name, so dropping the visible caption doesn't cost accessibility.

## Why it matters

- Removes a redundant readout above button pickers; the highlighted button is the source of truth.
- Keeps the value visible where the chooser can't convey it (swatches), preserving the quick "Color: Sage" readout in the heading.
- Cleans up the swatch grid to a uniform row of color squares/thumbnails with no captions; the heading is the single readout of the active value.

## Apply when

- The storefront still uses `components/product-detail/option-picker.tsx` and `color-picker.tsx` largely as shipped.

## Safe to skip when

- The storefront has its own picker markup or deliberately wants the active value echoed above every chooser.

## Validation

1. `pnpm --filter template dev`.
2. PDP with a text-button option (e.g. `Size`): heading reads `Size` with no value; the selected size is the highlighted button.
3. PDP with a color option backed by **color swatches**: heading reads `Color: <value>`, swatches render as bare squares with no captions.
4. PDP with a color option backed by **swatch/variant images**: heading reads `Color: <value>` and thumbnails render with no captions either.
5. Single-value non-Title option (e.g. `Finish: Natural White Oak`): unchanged — still renders as the inline `Name: Value` label.

## See also

- `pdp-single-value-option-labels` (2026-06-02) — the single-value label row that this entry leaves intact.
