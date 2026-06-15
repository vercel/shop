---
title: Variant picker — alpha shadow hairlines, filled selected pill
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

The PDP variant pickers drop 1px solid-color `border` hairlines in favor of the Geist design-system border technique: 1px box-shadow lines in **alpha** colors (cf. `--ds-shadow-border-base: 0 0 0 1px #00000014` on vercel.com). Alpha lets the anti-aliased corner pixels blend into the background, which is what makes rounded hairlines look smooth; solid mid-gray borders (`#c8c8c8`) are what read as "pixely".

- `option-picker.tsx`: unselected pills use `inset-ring inset-ring-foreground/15` (hover `/35`) instead of `border border-border`. The selected pill is a solid fill — `bg-primary text-primary-foreground` — with no outline at all, sidestepping hairline anti-aliasing entirely. (Thick inset rings were tried and rejected: an inset shadow's inner edge has a smaller corner radius than its outer edge, so ≥2px inset rings look chunky at corners.)
- `color-picker.tsx`: the selected swatch previously stacked an inset `ring-1 ring-foreground/50` on top of the swatch image's own 1px border at the same radius — two overlapping hairlines rendered crunchy. The subtle edge is now a single `after:` overlay (`after:inset-ring after:inset-ring-foreground/10`) drawn above the image, and selection is `ring-2 ring-foreground ring-offset-2 ring-offset-background` outside the swatch so it never overlaps the artwork. The inner `<Image>`/color div lose their `rounded-lg border` (the wrapper's `overflow-hidden rounded-lg` already clips).

## Why it matters

- Solid-color 1px borders on `rounded-lg` corners anti-alias dirtily, especially on low-DPI displays; alpha shadow hairlines blend smoothly on any background.
- A filled selected pill is unambiguous and has no thin line that can render badly.
- The swatch's offset selection ring reads as a deliberate indicator and doesn't tint or crop the artwork.

## Apply when

- The storefront uses the template's `OptionPicker` / `ColorPicker` largely as shipped.

## Safe to skip when

- The storefront has replaced the variant pickers with custom components or deliberately uses a different selection treatment (e.g. underlines, checkmarks).

## Validation

1. `pnpm --filter template dev`.
2. Open a PDP with both a color option and a text option (size). Confirm: selected pill renders as a solid `primary` fill with legible `primary-foreground` text; unselected pills show a soft alpha hairline; selected swatch shows a 2px offset ring with a single subtle inner hairline; unavailable values still render dimmed/struck-through.
3. `pnpm --filter template lint` clean.

## See also

- The same alpha-hairline technique is a candidate for the global `--border` token (`#c8c8c8` → an alpha black), which would smooth every bordered control; not done here to keep the change scoped.
