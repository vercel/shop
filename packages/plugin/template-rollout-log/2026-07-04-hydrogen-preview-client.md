---
title: Storefront API — replace @shopify/storefront-api-client and Intl price formatting with the @shopify/hydrogen preview SDK
changeKey: hydrogen-preview-client
introducedOn: 2026-07-04
changeType: refactor
defaultAction: review
appliesTo:
  - apps/template/lib/shopify/storefront.ts
  - apps/template/lib/shopify/errors.ts
  - apps/template/lib/utils.ts
  - apps/template/lib/markdown/utils.ts
  - apps/template/components/product/price.tsx
paths:
  - apps/template/package.json
---

## Summary

Replaced the Storefront API client and all price formatting with the framework-agnostic `@shopify/hydrogen` preview SDK (`0.0.0-preview-*`), as a like-for-like swap to evaluate Hydrogen before any deeper adoption.

**Client.** `lib/shopify/storefront.ts` now builds the shared `storefront` wrapper on Hydrogen's `createStorefrontClient` (`type: "public"`) instead of `@shopify/storefront-api-client`, which was removed from `package.json`. The `storefront.request<T>(query, { variables })` call-site contract is unchanged — operations, fragments, codegen (`@shopify/api-codegen-preset`), transforms, and cache behavior are untouched. Two Hydrogen behaviors required adaptation:

- The Hydrogen client injects `$country`/`$language` from its creation-time `i18n` config, overriding per-request variables. The wrapper therefore caches one client per country/language pair and selects it from the request's variables, preserving the template's per-call locale flow (single-locale deploys only ever populate the default entry).
- Transport failures now **throw** typed errors (`StorefrontApiError`, `StorefrontTimeoutError` — 30s default timeout) instead of resolving to an errors object. GraphQL-level errors still resolve to `{ data, errors }`; `assertStorefrontOk` in `lib/shopify/errors.ts` was updated for Hydrogen's `GraphQLFormattedError[]` shape.

The prior `customFetchApi` behavior (`?operation=` URL annotation, brotli header, `DEBUG_SHOPIFY` timing log) is preserved via Hydrogen's `fetch` config option. Env vars are unchanged (`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_API_VERSION`).

**Money.** The three price-formatting implementations (`formatPrice` in `lib/utils.ts`, `formatPrice` in `lib/markdown/utils.ts`, and the `Intl.NumberFormat` call in `components/product/price.tsx`) now delegate to Hydrogen's `formatMoney` with `currencyDisplay: "narrowSymbol"`. Output is byte-identical to the previous `Intl.NumberFormat` usage; helper signatures are unchanged.

**Deliberately not replaced** (evaluated and skipped for this pass): Hydrogen's cart store/server handlers (would re-architect the template's server-action + cache-tag cart and change cookie semantics), `getSelectedProductOptions` (doesn't replicate the template's case-insensitive option canonicalization for PDP URLs), `parseProductFilters` (not exported from the package's server entry), and the collection store, analytics bus, and Shop Pay button (client-side re-architectures or net-new features).

## Why it matters

Downstream storefronts tracking the template pick up Shopify's supported SDK for SFAPI transport: typed transport errors, request timeouts, buyer-IP-ready client types for future SSR throttle isolation, and maintained money formatting — while keeping the template's operations/transforms architecture intact.

## Apply when

- The storefront uses the template's `lib/shopify/storefront.ts` transport and wants to track the template's Hydrogen adoption path.

## Adopt with changes

- Storefronts that customized `customFetchApi` should port their customizations into the Hydrogen `fetch` config option.
- Storefronts that widened `assertStorefrontOk`'s error shape need the `GraphQLFormattedError[]` update in `lib/shopify/errors.ts`.

## Safe to skip when

- The storefront replaced the Shopify provider entirely, or pinned `@shopify/storefront-api-client` deliberately (e.g. custom retry middleware built against its API).
- The storefront wants to wait for a stable (non-preview) `@shopify/hydrogen` release before swapping transport.
