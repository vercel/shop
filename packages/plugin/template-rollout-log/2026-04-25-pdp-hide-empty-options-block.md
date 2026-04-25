---
title: PDP — return null from ProductInfoOptions when no pickers render
changeKey: pdp-hide-empty-options-block
introducedOn: 2026-04-25
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-info.tsx
---

## Summary

`ProductInfoOptions` filters out single-value options (the synthetic "Default Title" option Shopify emits for products with one variant, plus any user options that have collapsed to one value). When every option is filtered out, the component previously still rendered its wrapper `<div data-slot="product-info-options">` containing an empty `<div className="grid gap-10">`.

The right column on the PDP is `grid gap-10`, so an empty grid item still consumes a 40px row gap above and below itself. Result: a visible negative-space hole between the price block and the buy buttons on single-variant products.

Fix: return `null` from `ProductInfoOptions` when both `colorOptions` and `otherOptions` are empty.

## Why it matters

Single-variant products are common (one-SKU items, made-to-order pieces, products without variant axes). Without this fix the PDP looks broken for that whole category — there's a phantom 40–80px gap that downstream storefronts would otherwise have to debug independently.

## Apply when

- The storefront uses `components/product-detail/product-info.tsx` largely as shipped.
- The right-column layout is a `grid gap-*` (i.e. inter-sibling spacing comes from the parent, per the `sections-pilot-home-pdp` convention). Empty grid items are a layout bug under that convention.

## Safe to skip when

- The storefront has replaced `ProductInfoOptions` or moved to a different layout primitive that doesn't space empty children.
- The storefront has its own conditional wrapper around the options block that already short-circuits empty cases.

## Validation

1. `pnpm --filter template dev`.
2. Visit a single-variant PDP (e.g. a product whose only option is the default "Title: Default Title"). Confirm the right column reads price → buy buttons → description with consistent `gap-10` rhythm and no extra hole.
3. Visit a multi-variant PDP. Confirm pickers still render normally and the Suspense fallback still shows the option skeletons (multi-variant goes through the Suspense path, which is unaffected).
4. DevTools: on the single-variant PDP, confirm there is no `[data-slot="product-info-options"]` element in the right column.
