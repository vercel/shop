---
title: Complementary products — merchant-curated "Pairs well with" on the PDP
changeKey: complementary-products
introducedOn: 2026-06-20
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/components/product-detail/complementary-products.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/lib/i18n/messages/en.json
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
  - apps/docs/content/docs/shopify/pdp.mdx
---

## Summary

The PDP now surfaces Shopify's merchant-curated [complementary products](https://help.shopify.com/en/manual/online-store/search-and-discovery/product-recommendations) — the "Pair it with" set — as a compact "Pairs well with" list in the product info column, beside the buy section.

- A new `getComplementaryProducts()` operation calls the same `productRecommendations` query as related products but with `intent: COMPLEMENTARY`. `getProductRecommendations()` is unchanged in behavior — it now delegates to a shared `fetchRecommendations()` helper with the default `intent: RELATED`.
- `complementary-products.tsx` renders up to four products as thumbnail + title + price rows, modeled on `bundle-components.tsx`. It streams in behind a `Suspense` boundary (its own recommendation fetch, unlike the cached-shell bundle relationships) and collapses to nothing when no complementary products are configured.
- The list reuses the existing `ProductCard` domain type and `transformShopifyProductCard` — no new types.

## Why it matters

Complementary products are deliberately chosen add-ons (configured per product in the Search & Discovery app), not the algorithmic "you may also like" set. Presenting them next to the buy box — the way bundle relationships are presented — keeps that curation visible at the point of decision, instead of folding it into the recommendation grid below the product.

## Apply when

- The store uses the Shopify Search & Discovery app to curate complementary products and wants them shown on the PDP.
- You already surface related products and want to distinguish merchant-curated add-ons from automatic recommendations.

## Safe to skip when

- The catalog has no complementary products configured (the section simply renders nothing, so adopting it is harmless but inert).
- A custom PDP layout already owns the buy-section relationship area.

## Adoption notes

- Complementary products **require manual configuration** in the free [Search & Discovery](https://apps.shopify.com/search-and-discovery) app — there is no automatic fallback. `productRecommendations(intent: COMPLEMENTARY)` returns an empty list until a merchant sets them.
- `intent` is a query argument (`ProductRecommendationIntent`), available on Storefront API 2024-04+; the template defaults to 2026-04.
- A new `product.pairsWith` message ("Pairs well with") is added to `en.json`; add it to any other locale catalogs.
- This change is PDP + data layer only. The shopping agent's `get-recommendations` tool still uses `RELATED`; wiring complementary products into the agent is a separate change.

## Validation

1. Configure complementary products for a product in the Search & Discovery app and open its PDP; confirm the "Pairs well with" list renders with thumbnails, titles, and prices, and links resolve.
2. Open a product with no complementary products configured and confirm the section renders nothing (no empty heading).
3. Confirm related products ("You may also like") still render unchanged below the product.
4. Run `pnpm --filter template lint`, `pnpm --filter template build`, and `pnpm --filter docs build`.
