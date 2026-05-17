---
title: Source home Featured Products from the Shopify "frontpage" collection
changeKey: home-featured-frontpage-collection
introducedOn: 2026-05-17
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/page.tsx
  - apps/template/components/product/products-grid.tsx
---

## Summary

The home page's Featured Products grid previously called `getCatalogProducts({ limit, locale })`, which falls back to a `BEST_SELLING` browse of the entire catalog. There was no way for a merchant to curate which products appeared without code changes.

It now reads from Shopify's default `frontpage` collection via `getCollectionProducts({ collection: "frontpage", limit, locale })`. Every Shopify store ships with this collection, and merchants can curate it from the admin like any other collection.

- `FeaturedProducts` gained a required `collectionHandle` prop.
- `app/page.tsx` passes `collectionHandle="frontpage"` and points the "View all" link at `/collections/frontpage` instead of `/search`.
- `getCollectionProducts` already returns `{ products: [] }` when the collection is missing, so `FeaturedProductsGrid` continues to render nothing in that case (existing `products.length === 0` guard).

## Why it matters

- Merchants control the home page lineup from the Shopify admin without touching code.
- `BEST_SELLING` was a poor proxy for "what the store owner wants to feature" — new stores have no sales history, and even mature stores often want to surface seasonal or promotional picks that aren't top sellers.
- The "View all" link now lands on a real curated collection page instead of an unrelated full-catalog search.

## Apply when

- The storefront still calls `FeaturedProducts` with `collectionUrl="/search"` and no `collectionHandle`.

## Safe to skip when

- The storefront has already replaced the home grid with custom curation logic (manual handle list, metaobject-driven picks, a different collection handle, etc.).

## Validation

1. Confirm the `frontpage` collection exists in the connected Shopify store and contains at least one published product. (It ships by default but can be deleted.)
2. `pnpm dev` in `apps/template`. Visit `/`.
   - Featured Products grid renders the products in the `frontpage` collection, in the collection's configured order.
   - "View all" link goes to `/collections/frontpage` and renders the same collection page.
3. Empty the `frontpage` collection in the Shopify admin (or rename its handle). Trigger a fresh fetch. The Featured Products section should disappear gracefully (no error, no empty grid skeleton).

## Follow-ups

- If a storefront wants a different curated collection, they only need to change `collectionHandle` (and `collectionUrl`) in `app/page.tsx` — the component is otherwise collection-agnostic.
