---
title: Use native Shopify product filters on search
changeKey: search-native-product-filters
introducedOn: 2026-05-02
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/components/search/results.tsx
  - apps/template/lib/search/action.ts
  - apps/template/app/md/search/route.ts
relatedSkills:
  - /vercel-shop:shopify-graphql-reference
---

## Summary

The search page now fetches products, facets, total count, and pagination through Shopify's native `search(productFilters: ...)` API.

## Why it matters

This aligns search with Hydrogen-style filtering, keeps counts consistent with the rendered products, and supports filters such as variant options and product metafields that query-string catalog search could not apply.

## Apply when

- `/search` uses faceted filters or displays a result count.
- Search pages need variant option filters such as color or size to affect the product grid.
- Search pages need product metafield filters to behave like collection filters.

## Safe to skip when

- The storefront does not expose faceted filters on `/search`.
- The storefront intentionally uses a custom search provider instead of Shopify Storefront API search.

## Validation

1. `/search?filter.v.price.gte=2000` should show a filtered count consistent with the rendered products.
2. `/search?q=shirt&filter.v.option.color=red` should only show products matching the selected variant option.
3. Infinite scroll on a filtered search should keep applying the same active filters.
4. `/app/md/search` with equivalent filters should return filtered products and total count.
5. `pnpm --filter template lint` and `pnpm --filter template build` should pass.
