---
title: Use Shopify default currency for single-locale pricing chrome
changeKey: shopify-default-currency
introducedInVersion: 0.1.0
introducedOn: 2026-04-15
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/cart/context.tsx
  - apps/template/components/collections/filter-sidebar.tsx
  - apps/template/lib/collections/server.ts
  - apps/template/lib/markdown/catalog.ts
  - apps/template/lib/shopify/operations/shop.ts
relatedSkills:
  - /vercel-shop:enable-shopify-markets
---

## Summary

The template no longer hardcodes USD for single-locale search and collection pricing chrome. Filter presets, markdown price ranges, and optimistic cart fallbacks now use the currency Shopify reports for the store or the current product results.

## Why it matters

Stores whose Shopify base currency is not USD could show mismatched symbols or markdown output even when storefront prices were otherwise correct. This keeps template-generated price UI aligned with Shopify's default currency.

## Apply when

- Your storefront runs in single-locale mode.
- Your Shopify shop currency is not USD.
- Search filters or markdown endpoints showed `$` while Shopify pricing used another currency.

## Safe to skip when

- Your shop currency is already USD.
- You already derive filter and markdown currency directly from Shopify.

## Validation

- Visit a collection or search page and confirm the price filter symbol matches Shopify's base currency.
- Request `/collections/<handle>` or `/search?q=<term>` with `Accept: text/markdown` and confirm price ranges use the same currency as product prices.
- Add a product to cart and confirm any optimistic subtotal placeholder matches the variant currency.
