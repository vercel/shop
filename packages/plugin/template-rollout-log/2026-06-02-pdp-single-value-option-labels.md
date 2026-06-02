---
title: PDP — show single-value options as inline label instead of hiding
changeKey: pdp-single-value-option-labels
introducedOn: 2026-06-02
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-info.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

`ProductInfoOptions` previously filtered out every option whose `values.length === 1`. That correctly hid Shopify's synthetic `Title: Default Title` option for products with no variant axes, but it also hid genuine single-value user options (e.g. a shirt whose only `Color` is `Orange`) — useful information for the shopper to confirm what they're buying.

The filter now distinguishes the two:

- `isShopifyDefaultOption(opt)` — true only when `opt.name === "Title"` _and_ the single value is exactly `"Default Title"`. These are dropped entirely.
- `isSingleValueOption(opt)` — any other one-value option. These render as a label-only row (`Name: Value`) using the same `text-sm font-medium text-foreground/70` / `text-foreground` styling as the picker headings, but with no button or swatch grid below.

Single-value labels render at the top of the options grid, above color/size pickers, so they read as "fixed attributes" that frame the choices below.

If a product has _no_ renderable options after this filter (only Shopify's synthetic Title, or no options at all), `ProductInfoOptions` still returns `null` — the empty-block fix from `pdp-hide-empty-options-block` is preserved.

## Why it matters

- Communicates an attribute that customers might otherwise have to infer from the title or description (e.g. "this nightstand only comes in `Natural Birch`").
- Keeps the markup consistent: every option a merchant configured shows up somewhere on the page, with or without a chooser.
- Avoids the prior failure mode where a one-color product's color was effectively invisible on the PDP.

## Apply when

- The storefront still uses `components/product-detail/product-info.tsx` largely as shipped.
- The product catalog contains products with single-value options that should be visible (the common case).

## Safe to skip when

- The storefront has its own option-rendering logic.
- The storefront prefers to hide fixed attributes from the buy box and surface them elsewhere (e.g. in the description or a custom metafield block).

## Validation

1. `pnpm --filter template dev`.
2. Visit a PDP with a single-value non-Title option (e.g. a product whose only `Finish` is `Natural White Oak`). Confirm the right column reads `Finish: Natural White Oak` as a plain label between price and buy buttons, with no swatch grid or button row.
3. Visit a multi-variant PDP. Confirm the picker(s) still render with buttons/swatches as before.
4. Visit a single-variant PDP whose only option is Shopify's synthetic `Title: Default Title`. Confirm no `[data-slot="product-info-options"]` element renders in the right column (regression check for `pdp-hide-empty-options-block`).
5. Visit a PDP that has both a single-value option (e.g. `Material: Solid Oak`) _and_ a multi-value picker (`Size`). Confirm the inline label appears above the size picker in the same vertical rhythm.

## See also

- `pdp-hide-empty-options-block` (2026-04-25) — the prior fix that this entry refines.
