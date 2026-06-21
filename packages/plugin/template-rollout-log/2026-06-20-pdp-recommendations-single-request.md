---
title: PDP recommendations — fetch complementary + related in one request
changeKey: pdp-recommendations-single-request
introducedOn: 2026-06-20
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/components/product-detail/complementary-products.tsx
  - apps/template/components/product/related-products-section.tsx
  - apps/template/lib/agent/tools/get-recommendations.ts
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

The PDP's two recommendation surfaces — the merchant-curated "Pairs well with" list beside the buy section and the algorithmic "You may also like" grid below the fold — now come from a single Shopify request instead of two.

- `getProductRecommendations()` and `getComplementaryProducts()` (and the shared `fetchRecommendations()` helper) are replaced by one `getProductRecommendationSets()` operation. It runs one `productRecommendations` query that aliases both intents — `complementary: productRecommendations(intent: COMPLEMENTARY)` and `related: productRecommendations(intent: RELATED)` — and returns `{ complementary, related }`.
- The query keys on `productHandle` rather than `productId`, so it no longer depends on first resolving the product to get its ID.
- Both PDP surfaces call `getProductRecommendationSets()` with the same arguments. Because it's `use cache: remote`, they dedupe to **one** Shopify request and one cache entry, tagged with both `complementary-{handle}` and `recommendations-{handle}` — so either webhook invalidation still busts it.
- Rendering is unchanged: the complementary list still prerenders eagerly into the static shell, and the related grid still streams behind its `Suspense` boundary.
- The shopping agent's `get-recommendations` tool now returns complementary + related (deduped by handle), matching its "what goes well with this?" description, instead of only `RELATED`.

## Why it matters

- One fewer Shopify round-trip per PDP, and the recommendations query no longer waits on a product-by-handle lookup to obtain the ID.
- No behavioral or layout change: the eager-vs-streamed split between complementary and related is preserved.

## Apply when

- You adopted the complementary-products change (`complementary-products`) and/or related products and want to drop the second recommendations request.

## Safe to skip when

- A custom PDP needs complementary and related invalidated **independently** — the merge shares one cache entry and both tags, so busting either tag refreshes both sets.

## Adoption notes

- Supersedes the data-layer description in `2026-06-20-complementary-products.md`: the shared `fetchRecommendations()` helper and the separate `getProductRecommendations()` / `getComplementaryProducts()` operations are removed in favor of `getProductRecommendationSets()`.
- `productRecommendations` accepts `productHandle` on the Storefront API (2024-04+; the template defaults to 2026-04), which is what lets the combined query key on the handle and run independently of `getProduct()`.
- Update both consumers and any custom callers to read the `complementary` / `related` slice from `getProductRecommendationSets()` rather than calling the removed single-intent operations.

## Validation

1. Open a PDP with both complementary products configured (Search & Discovery app) and related products available; confirm a single `productRecommendationSets` request is issued and both "Pairs well with" and "You may also like" render.
2. Open a product with neither configured and confirm both sections render nothing.
3. Run `pnpm --filter template lint`, `pnpm --filter template build`, and `pnpm --filter docs build`.
