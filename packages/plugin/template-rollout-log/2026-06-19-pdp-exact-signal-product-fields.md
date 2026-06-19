---
title: PDP exact-signal product fields (variantsCount, hasUniformPricing, allVariantsInStock)
changeKey: pdp-exact-signal-product-fields
introducedOn: 2026-06-19
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
supersedes:
  - pdp-selected-options-variant-urls
paths:
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/lib/types.ts
  - apps/template/lib/product.ts
  - apps/template/lib/shopify/encoded-variants.ts
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

`ProductDetails` now carries three precomputed, product-level signals instead of recomputing them
in the PDP from helper functions:

- `variantsCount` — the exact variant count, queried from Shopify's `variantsCount { count }`.
- `hasUniformPricing` — `true` when the `priceRange` (and `compareAtPriceRange`) min/max bounds match,
  so the price renders eagerly in the static shell without the suspended variant query.
- `allVariantsInStock` — `true` when every existing variant is in stock (`encodedVariantExistence`
  equals `encodedVariantAvailability`), so buy-button labels can resolve in the Suspense fallback.

The values are computed once in `transformShopifyProductDetails` and read as fields by
`product-detail-section.tsx`. The previous component-side helpers are removed:
`hasUniformPricing` / `hasUniformStock` (`lib/product.ts`) and `countEncodedVariants`
(`lib/shopify/encoded-variants.ts`). `decodeEncodedVariant` / `getAvailableOptionValues` are
unchanged.

## Why it matters

Single-variant detection previously decoded the `encodedVariantExistence` trie and compared its
length (`<= 1`). That trie is a proxy: Shopify returns an empty string for synthetic single-option
products and omits it past certain variant counts, so the proxy mis-fires. `variantsCount === 1` is
the authoritative single-variant signal, and `variantsCount` is also the correct value for JSON-LD
`offerCount`. Modeling uniform-pricing and all-in-stock as fields keeps the derivation in one place
(the transform) rather than duplicated across consumers.

This supersedes the variant-count detail of [`pdp-selected-options-variant-urls`](./2026-06-18-pdp-selected-options-variant-urls.md):
the encoded-existence trie no longer drives the variant count.

## Apply when

- The storefront reads the PDP shell from `getProduct` and renders price / buy buttons eagerly for
  uniform-price or single-variant products.
- The storefront derives single-variant status by decoding the encoded-existence trie.

## Adoption notes

- `Product.variantsCount { count }` is a Storefront API 2024-10+ field (the template defaults to
  2026-04). It is added to `ProductFields`, so both `getProduct` (slim shell) and the
  with-variants queries (agent / markdown) receive it.
- Read the exact signals from `ProductDetails`: `variantsCount`, `hasUniformPricing`,
  `allVariantsInStock`. Do not infer them from `ProductDetails.variants` (a representative set).
- Behavior is unchanged: `allVariantsInStock` equals the old `hasUniformStock(product)` value, and
  `hasUniformPricing` is the old helper's logic moved into the transform.

## Validation

1. `pnpm --filter template lint`, `pnpm --filter template build`.
2. Confirm `/products/[handle]` still reports Partial Prerender.
3. On a single-variant product, confirm price + buy buttons render eagerly (no suspended flash) and
   JSON-LD `offerCount` equals the real variant count.
4. On a multi-variant, varying-price product, confirm the price resolves through the suspended
   variant query and swatch availability still reflects `encodedVariantAvailability`.
