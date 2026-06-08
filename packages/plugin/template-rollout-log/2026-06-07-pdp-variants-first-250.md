---
title: PDP — fetch up to 250 product variants instead of 50
changeKey: pdp-variants-first-250
introducedOn: 2026-06-07
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/fragments.ts
---

## Summary

`PRODUCT_FRAGMENT` selected `variants(first: 50)`. Products with more than 50 variants (large size/color matrices, configurable products) had their extra variants silently dropped from the PDP — those options couldn't be selected or purchased.

Bumped the limit to `variants(first: 250)`, which is the Storefront API's maximum page size for a connection.

## Why it matters

50 is below what a real catalog can carry: a product with, say, 8 sizes × 7 colors already exceeds it. The truncation is invisible — the query succeeds, the page renders, and only the missing variants reveal the problem. Downstream storefronts with deep variant matrices would otherwise hit this as a hard-to-spot "some variants can't be bought" bug.

## Apply when

- The storefront uses `PRODUCT_FRAGMENT` from `lib/shopify/fragments.ts` largely as shipped.
- Any product could plausibly carry more than 50 variants.

## Safe to skip when

- Every product is known to stay under 50 variants and the smaller response payload is worth keeping.
- The storefront has already moved variant fetching to a paginated/lazy approach.

## Validation

1. `pnpm --filter template dev`.
2. Visit a PDP for a product with more than 50 variants and confirm every variant combination is selectable and purchasable.
3. Confirm normal multi- and single-variant PDPs are unaffected.
