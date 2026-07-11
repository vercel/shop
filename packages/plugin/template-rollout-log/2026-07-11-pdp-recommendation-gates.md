---
title: Split and gate PDP recommendation operations
changeKey: pdp-recommendation-gates
introducedOn: 2026-07-11
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/fetch.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/components/product-detail/complementary-products.tsx
  - apps/template/components/product/related-products-section.tsx
  - apps/template/lib/agent/tools/get-recommendations.ts
  - apps/template/app/api/webhooks/shopify/route.ts
---

## Summary

Complementary and related products now use separate cached Shopify operations. Their rendering parents own the `pdp.complementaryProducts.enabled` and `pdp.relatedProducts.enabled` gates and do not mount the components when disabled, preventing their fetches from running.

The shopping agent still returns both recommendation types by starting the independent operations together. Both cache entries use the existing `recommendations-{handle}` tag invalidated by product webhooks.

## Why it matters

The previous combined operation fetched both recommendation intents whenever either surface rendered. A storefront could hide complementary or related products, but the enabled surface still requested the disabled surface's data. Separating the operations makes the feature gates control both rendering and Shopify requests.

## Apply when

- The storefront uses the PDP recommendation gates from `shop.config.ts`.
- Complementary and related recommendation data should be fetched independently.
- The storefront adopted `pdp-recommendations-single-request` and now prefers complete feature isolation over one combined request.

## Safe to skip when

- Both recommendation surfaces are always enabled and a single combined Shopify request is intentionally preferred.
- A custom recommendation service already owns independent gating and caching.

## Adoption notes

This change supersedes the combined-operation guidance in `2026-06-20-pdp-recommendations-single-request.md`. Replace `getProductRecommendationSets()` and `fetchProductRecommendationSets()` callers with `getComplementaryProducts()` or `getRelatedProducts()` as appropriate.

## Validation

1. Set `pdp.complementaryProducts.enabled` to `false`; confirm the complementary component renders nothing and no complementary-products operation runs.
2. Set `pdp.relatedProducts.enabled` to `false`; confirm PDP and cart related sections render nothing and no related-products operation runs.
3. Enable both surfaces; confirm both sections render from their respective Shopify recommendation intents.
4. Run template GraphQL codegen, type checking, and linting, then run the docs path linter.
