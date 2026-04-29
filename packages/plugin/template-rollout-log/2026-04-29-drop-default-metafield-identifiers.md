---
title: Drop default metafield identifiers from PRODUCT_FRAGMENT
changeKey: drop-default-metafield-identifiers
introducedOn: 2026-04-29
changeType: breaking
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/fragments.ts
  - apps/docs/content/docs/shopify/pdp.mdx
---

## Summary

Removes the entire `metafields(identifiers: [...])` block — and the `${METAFIELD_FRAGMENT}` import that supported it — from `PRODUCT_FRAGMENT`. Previously the template hardcoded 14 identifiers across two arbitrary namespaces:

- 8 under `custom`: `material`, `dimensions`, `weight`, `connectivity`, `battery_life`, `warranty`, `country_of_origin`, `model_number`
- 6 under `specs`: `material`, `dimensions`, `weight`, `connectivity`, `battery_life`, `warranty`

Neither namespace is a Shopify standard. Shopify's standard product metafield namespaces are `descriptors`, `facts`, `reviews`, `shopify`, etc. — `custom` and `specs` are merchant-defined and shop-specific, so the template no longer presumes either.

The supporting code is intentionally kept so storefronts can wire their own identifiers without re-introducing scaffolding:

- `Metafield` type in `lib/types.ts`
- `metafields?: Metafield[]` field on `ProductDetails`
- `METAFIELD_FRAGMENT` export in `lib/shopify/fragments.ts`
- `transformMetafields()` and `METAFIELD_LABELS` in `lib/shopify/transforms/product.ts`

## Why

Hardcoding namespaces in the template shipped dead query weight to most stores (their keys don't match) and produced duplicate spec rows on stores that populated both namespaces with the same key. Defaulting to "no metafields wired up" makes the contract explicit: storefronts opt in to whichever namespaces they actually use.

## Impact

- **No PDP UI change** for stores with no metafields populated under `custom.*` / `specs.*`.
- **PDP loses spec rows** for stores that relied on either namespace via the template default. Those rows currently surface only in the agent's product-context markdown (`lib/markdown/product.ts`) — there is no PDP UI consumer of `ProductDetails.metafields` in-template today.
- The `Metafield` shape and `transformMetafields()` still work; an empty/undefined `product.metafields` produces `[]`, which the markdown builder skips cleanly.

## Adoption

If your storefront uses metafields, add a `metafields(identifiers: [...])` block back to `PRODUCT_FRAGMENT` with the namespaces and keys you actually populate, and re-add `${METAFIELD_FRAGMENT}` to the fragment's import list. Extend `METAFIELD_LABELS` with friendly labels for any new keys. The example in `apps/docs/content/docs/shopify/pdp.mdx` shows the minimal pattern.
