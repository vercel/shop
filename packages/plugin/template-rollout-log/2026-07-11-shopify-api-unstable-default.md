---
title: Default Shopify APIs to unstable
changeKey: shopify-api-unstable-default
introducedOn: 2026-07-11
changeType: breaking
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/.env.example
  - apps/template/.graphqlrc.ts
  - apps/template/lib/shopify/customer-account.ts
  - apps/template/lib/shopify/storefront.ts
---

## Summary

The template now defaults `SHOPIFY_API_VERSION` to `unstable` for Storefront API runtime requests, Customer Account API requests, and Storefront GraphQL codegen. Setting `SHOPIFY_API_VERSION` still overrides the default across all three paths.

## Why it matters

The template can use and validate against Shopify's latest preview schema without waiting for a dated stable API release. Because the unstable schema can change without the guarantees of a stable version, downstream storefronts should adopt this default intentionally.

## Apply when

- The storefront should track Shopify's newest Storefront and Customer Account API capabilities.
- The storefront's GraphQL operations pass codegen against the unstable Storefront schema.

## Safe to skip when

- Production stability requires a dated Shopify API version.
- The storefront has not validated its operations and customer account flows against unstable.

## Validation

1. Run `pnpm --filter template codegen` with `SHOPIFY_API_VERSION` unset.
2. Run `pnpm --filter template lint`.
3. If authentication is enabled, exercise login and an authenticated Customer Account API request.
