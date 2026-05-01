---
title: Use Shopify's variant query parameter for product variant URLs
changeKey: shopify-variant-query-param
introducedOn: 2026-05-01
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/lib/product.ts
relatedSkills:
  - /vercel-shop:enable-i18n
  - /vercel-shop:enable-shopify-markets
---

## Summary

Product variant URLs now use Shopify's standard `?variant=` query parameter instead of the template-specific `?variantId=` parameter.

## Why it matters

This matches Shopify theme conventions, including Horizon, and makes storefront links easier to compare with native Shopify product URLs.

## Apply when

- The storefront still generates product variant links with `?variantId=`.
- The PDP reads `searchParams.variantId` instead of `searchParams.variant`.

## Safe to skip when

- The storefront intentionally keeps a custom variant URL scheme and has redirects or analytics depending on it.
- The storefront already uses `?variant=` for variant-specific product links.

## Validation

1. Product cards with a default variant should link to `/products/:handle?variant=:id`.
2. PDP option links should update the URL with `?variant=:id`.
3. Loading a product URL with `?variant=:id` should select the matching options and variant media.
4. `pnpm --filter template lint` and `pnpm --filter template build` should pass.
