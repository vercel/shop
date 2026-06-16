---
title: Derive the PDP static price from the product price range, not variant prices
changeKey: pdp-uniform-price-from-range
introducedOn: 2026-06-16
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/lib/product.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/lib/types.ts
---

## Summary

The PDP renders the price into the static shell (no Suspense, no `?variant=` wait) when every variant shares one price. That uniform-price path no longer reads the `variants` array. `hasUniformPricing()` now takes the product's `priceRange` (and optional `compareAtPriceRange`) and reports uniform when `minVariantPrice === maxVariantPrice`. The static `<ProductPrice>` renders from `product.priceRange.minVariantPrice` and `product.compareAtPriceRange?.minVariantPrice` instead of `variants[0].price` / `variants[0].compareAtPrice`.

Supporting changes: `compareAtPriceRange` (min + max) is now surfaced on the `ProductDetails` domain type and mapped in `transformShopifyProductDetails`. Both `priceRange` and `compareAtPriceRange` were already requested in the product fragment — only the regular `priceRange` was being kept before. The non-uniform path (Suspense → resolved selected variant) is unchanged.

## Why it matters

Decouples the statically-rendered price from having the full variant set loaded. If a storefront moves to a model where variants are fetched lazily or partially (deferred variant loading, paginated variants, a lighter PDP query), `variants[0].price` and a variants `.every()` scan would be wrong or empty, whereas `priceRange` is a product-level field that is always complete. The visible price and strikethrough render identically to before for products fetched with the full variant set.

## Apply when

- Always, for PDP price rendering. It is a behavior-preserving refactor with no UI change for the current full-variant query.
- Especially relevant before adopting any change that stops loading all variants up front.

## Safe to skip when

- You have diverged the PDP price rendering and no longer rely on `hasUniformPricing` or the static-shell price path.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit`.
2. Single-price product (all variants same price): price renders in the static shell with no layout shift on load and no `?variant=` dependency.
3. Multi-price product: price still streams in behind its Suspense fallback and updates as `?variant=` changes.
4. On-sale uniform product: the compare-at strikethrough and discount badge still render; a product with no compare-at shows no strikethrough.
