---
title: Configure single-locale default currency for pricing chrome
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

The template no longer hardcodes USD for single-locale search and collection pricing chrome. Filter presets and markdown price ranges now use product currency when available and fall back to `SHOPIFY_DEFAULT_CURRENCY` for empty-result states.

## Why it matters

Stores whose Shopify base currency is not USD could show mismatched symbols or markdown output even when storefront prices were otherwise correct. This adds an explicit config path so template-generated price UI stays aligned with the storefront's intended default currency.

## Apply when

- Your storefront runs in single-locale mode.
- Your Shopify shop currency is not USD.
- Search filters or markdown endpoints showed `$` while Shopify pricing used another currency.

## Safe to skip when

- Your shop currency is already USD and you are fine with the default.
- You already derive filter and markdown currency directly from Shopify.

## Validation

- Set `SHOPIFY_DEFAULT_CURRENCY` to your shop currency in `.env.local` or your deployment environment.
- Visit a collection or search page and confirm the price filter symbol matches your configured currency.
- Request `/collections/<handle>` or `/search?q=<term>` with `Accept: text/markdown` and confirm price ranges use the same currency as product prices.
- Add a product to cart and confirm any optimistic subtotal placeholder matches the variant currency.
