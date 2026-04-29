---
title: Drop default `custom.*` metafield identifiers from PRODUCT_FRAGMENT
changeKey: drop-default-custom-metafields
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

Removes the 8 `{namespace: "custom", key: ...}` identifiers from the `metafields(identifiers: [...])` call inside `PRODUCT_FRAGMENT`. The 6 `specs.*` identifiers are kept. Each shop's `custom` namespace is shop-specific, so the template no longer presumes a particular set of `custom` keys.

Previously fetched (and now dropped):

- `custom.material`, `custom.dimensions`, `custom.weight`, `custom.connectivity`
- `custom.battery_life`, `custom.warranty`
- `custom.country_of_origin`, `custom.model_number`

The `METAFIELD_LABELS` map in `lib/shopify/transforms/product.ts` is unchanged — the labels still apply to any matching key regardless of namespace, so wiring the same keys under a different namespace later still gets a friendly label for free.

## Why

Hardcoding a `custom` schema in the template ships dead query weight to most stores (their `custom` keys don't match), and produces duplicate spec rows on stores that did populate both `custom.*` and `specs.*` with the same key. Defaulting to a single, deliberately-named `specs` namespace keeps the template's expectations explicit and shop-agnostic.

## Impact

- **No PDP UI change** for shops that only used `specs.*`.
- **PDP UI loses spec rows** for shops that relied on `custom.*` to populate `ProductDetails.metafields`. Those shops should either move their data to `specs.*` or restore the relevant identifiers in `lib/shopify/fragments.ts`.
- The agent's product-context markdown (`lib/markdown/product.ts`) is the only consumer of `metafields[]` today, so the visible effect downstream is "fewer specs in the agent context" until the storefront wires its own namespace back in.

## Adoption

If your storefront uses the `custom` namespace, add the keys you actually use back to `PRODUCT_FRAGMENT`'s `metafields` identifier list. If you've already migrated to `specs`, no action needed.
