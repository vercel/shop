---
title: Add canonical shop configuration
changeKey: base-shop-config
introducedOn: 2026-07-11
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/shop.config.ts
  - apps/template/lib/config.ts
  - apps/template/lib/agent/server.ts
  - apps/template/lib/auth/
  - apps/template/components/product-detail/
  - apps/template/components/product/
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/app/cart/page.tsx
---

## Summary

The template now has a typed, secret-free `shop.config.ts` for canonical storefront behavior. It owns the shopping assistant model, maximum steps, tool allowlist, and default enablement; the authentication default and provider ID; and PDP bundle, complementary-product, related-product, and specification settings.

`NEXT_PUBLIC_ENABLE_AGENT` and `NEXT_PUBLIC_ENABLE_AUTH` remain deployment overrides. When an override is unset, `lib/config.ts` uses the corresponding `enabledByDefault` value. Shopify and environment variables remain the sources for data and credentials.

## Why it matters

Storefront policy was previously split across hardcoded component constants, agent setup, and environment-only feature gates. A central config gives developers and agents one discoverable place to change canonical behavior without moving secrets or merchant data into source code.

## Apply when

- The storefront wants a central typed configuration surface.
- Agent model, step count, or tool availability should be customizable without editing agent internals.
- PDP bundles, upsells, related products, limits, or specifications should be configurable.
- Auth or agent defaults should live in source while remaining overridable per deployment.

## Safe to skip when

- The storefront already has an equivalent configuration layer.
- These policies are intentionally managed in a separate CMS or deployment system.

## Validation

1. Run `pnpm --filter template exec tsc --noEmit` and `pnpm --filter template lint`.
2. Run the docs path linter for the new config references.
3. Remove an agent tool from the allowlist and confirm it is absent from `agent.tools`.
4. Set each `enabled` PDP value to `false` and confirm its surface does not render; confirm disabled recommendation surfaces do not fetch.
5. Set auth enabled by default without credentials and confirm the build-time environment validation fails.
