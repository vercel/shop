---
title: Customer Account API — replace the hand-rolled fetcher with @shopify/hydrogen's createCustomerAccountClient
changeKey: customer-account-hydrogen-client
introducedOn: 2026-07-10
changeType: refactor
defaultAction: review
appliesTo:
  - apps/template/lib/shopify/customer-account.ts
paths:
  - apps/template/package.json
  - apps/template/lib/shopify/customer-account.ts
  - apps/template/lib/auth/server.ts
  - apps/docs/content/docs/anatomy/authentication.mdx
  - apps/docs/content/docs/reference/storefront-api.mdx
---

## Summary

`customerAccountFetch` in `lib/shopify/customer-account.ts` now wraps `@shopify/hydrogen/customer-account`'s `createCustomerAccountClient` instead of a hand-rolled `fetch`. This retires the last DIY GraphQL fetcher in the template, so both the Storefront and Customer Account APIs run on the first-party Hydrogen SDK.

The function's public signature is unchanged — `customerAccountFetch<T>({ accessToken, operation, query, variables })` — so `lib/shopify/operations/customer.ts` (its only importer) needs no edits, and better-auth remains the session/OAuth engine.

What changed inside the module:

- **Client.** Each call builds a `createCustomerAccountClient({ shopId, customerApiVersion, requestContext })` and runs `client.graphql(gql(query), { accessToken, variables })`. Transport, timeout (30s default), typed errors (`CustomerAccountApiError` etc.), and the `Origin`/`User-Agent` headers now come from Hydrogen.
- **shopId, not endpoint URL.** The OIDC-discovery derivation is kept (numeric shop ID from the issuer, cached for the process lifetime), but it now caches the `shopId` string rather than the full endpoint URL — Hydrogen's client builds the endpoint from `shopId`.
- **Request context.** Hydrogen's client requires a `requestContext` (via `createShopifyRequestContext`, imported from the core `@shopify/hydrogen` entry — it is not re-exported from the `/customer-account` subpath) carrying the resolved `i18n` and an HTTPS `origin` for the mandatory `Origin` header. The wrapper reuses the app's configured base URL through a newly-exported `getAuthBaseUrl()` in `lib/auth/server.ts`.
- **Runtime documents.** Operations still pass plain query strings; the wrapper brands `gql(query)` as `CustomerAccountDocument<T, Record<string, unknown>>` so the client accepts our variables instead of inferring `never` (same escape hatch as the storefront wrapper). Customer operations keep their hand-written response types — no customer codegen.

Behavioral deltas from the old fetcher: transport failures now throw Hydrogen's typed errors instead of a generic `Error`; the `?operation=` URL annotation is dropped (the client owns the URL), though the `DEBUG_SHOPIFY` timing log is preserved; requests now send an `Origin` header derived from the app base URL.

## Why it matters

Both Shopify GraphQL surfaces now share one maintained, first-party client with consistent transport, timeouts, and typed errors — no bespoke fetch/JSON-guard code to keep in sync with API behavior.

## Apply when

- The storefront uses the template's `lib/shopify/customer-account.ts` transport with better-auth sessions and wants to track the template's Hydrogen adoption.

## Adopt with changes

- Storefronts that customized the hand-rolled customer fetcher (extra headers, telemetry, retry) must re-express those against Hydrogen's client options or `fetch` override.
- Storefronts that catch the old generic `Error` from customer calls should handle Hydrogen's `CustomerAccountApiError` family instead.
- Storefronts whose OAuth-registered origin differs from `getAuthBaseUrl()` must supply the correct `requestContext.url`.

## Safe to skip when

- The storefront replaced customer auth/data entirely, or wants a stable (non-preview) `@shopify/hydrogen` release before adopting its Customer Account client.

## Validation

1. `pnpm --filter template build` — codegen gate + `next build` pass, including the authenticated `/account/*` routes.
2. `pnpm --filter template lint` — oxlint + oxfmt clean.
3. With auth enabled, exercise the account pages (profile, orders, order detail, addresses) and the address/profile mutations end to end against a real Shopify store.
