---
title: Product card — show a "min – max" price range when variants span one
changeKey: product-card-price-range
introducedOn: 2026-06-21
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/lib/types.ts
  - apps/template/components/product-card/components.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
relatedSkills: []
---

## Summary

Product cards now reflect a varying price instead of showing a bare minimum. When a product's variants span a price range (`priceRange.minVariantPrice ≠ maxVariantPrice`), the card renders both bounds as a `min – max` range — _$48.00 – $96.00_ — and suppresses the compare-at strike-through and discount badge (per-variant discounts differ across a range, so a single one would mislead). Single-price products are unchanged.

Mechanics:

- `ProductCardFields` (`fragments.ts`) now selects `priceRange.maxVariantPrice` alongside `minVariantPrice`; codegen regenerated.
- `ShopifyProductCard.priceRange` gains `maxVariantPrice`; the `ProductCard` domain type gains `maxPrice: Money`, set from `priceRange.maxVariantPrice` in both `transformShopifyProductCard` and `transformShopifyProductDetails`.
- `ProductCardPrice` takes an optional `maxAmount`; when it differs from `amount` the component renders `min – max` (en-dash separator, matching the filter range UI) and drops the discount UI.
- The two card renderers (`product-card.tsx`, `infinite-product-grid.tsx`) pass `maxAmount={product.maxPrice.amount}`. No i18n string or label threading is needed — the range is pure product data.

## Why it matters

- Grids and sliders previously displayed only `minVariantPrice` with no signal that pricing varied, so a $48–$96 product read as a flat "$48.00". Showing both bounds sets correct price expectations before the click.
- `maxPrice` lives on the base `ProductCard` type, so it is available wherever cards render (home, PLP, search, recommendations) without per-call-site plumbing.
- The agent product card (`components/agent/registry.tsx`) is unaffected — it parses prices from strings and has no range data, so it keeps a single price.

## Apply when

- The storefront uses the template product cards largely as shipped and sells products with per-variant pricing (size/material tiers, etc.).

## Safe to skip when

- The catalog is effectively single-price per product (no variant price spread), so `maxPrice === price` everywhere and nothing changes.
- You prefer the compact "From {min}" convention over an explicit range (drop `maxAmount`, gate on `price !== maxPrice`, and render a localized "From" label before the min).

## Validation

1. `pnpm --filter template codegen` (regenerates the fragment types), then `pnpm --filter template lint` and `pnpm --filter template build`.
2. `pnpm --filter template start`: a product whose variants differ in price shows _$min – $max_ with no discount badge; a single-price product shows the plain price and keeps its strike-through/percent-off when on sale.
3. `grep -n 'maxPrice' apps/template/lib/types.ts apps/template/lib/shopify/transforms/product.ts` → present on the type and set in both transforms.

## See also

- `anatomy/product-card` docs — the **Price** section documents the range behavior.
