---
title: Make generateStaticParams resilient to empty / unreachable Shopify stores
changeKey: generate-static-params-empty-store-resilience
introducedOn: 2026-05-26
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/app/collections/[handle]/page.tsx
---

## Summary

`generateStaticParams` for `/products/[handle]` and `/collections/[handle]` no longer breaks the build when the Shopify store has zero products or zero collections, or when the Storefront API is briefly unreachable during build.

Both routes now:

1. Wrap the seed fetch (`getCatalogProducts({ limit: 1 })` / `getCollections({ limit: 1 })`) in `try/catch`.
2. Always return at least one entry — falling back to a `__placeholder__` handle when the fetch returns nothing or throws.
3. Short-circuit the placeholder in `generateMetadata` (empty metadata or `notFound()`) and in the page itself (`notFound()`), so the placeholder route never tries to fetch `productByHandle("__placeholder__")` or render a real page.

The collections route previously had a `"__placeholder__"` literal in `generateMetadata` but no scaffolding in `generateStaticParams` or the default export. The PDP had a `PLACEHOLDER_HANDLE` constant referenced in metadata and the page but not in `generateStaticParams`. This change makes both routes use the same shape.

## Why it matters

- A freshly bootstrapped storefront with an empty Shopify catalog could fail `next build` because the prerender step had no params to work with. Returning a placeholder gives Next.js a stable shell to prerender; the page renders as a 404 at request time.
- Transient Storefront API errors during build (network blip, throttling, missing build-time env) no longer cascade into a failed deploy. The build always produces at least the placeholder shell.
- Aligns PDP and PLP on the same pattern so the next agent that touches either route doesn't have to rediscover the convention.

## Apply when

- The storefront still ships the default `/products/[handle]` and `/collections/[handle]` routes.
- The storefront may be deployed before its Shopify catalog is populated, or has intermittent build-time connectivity to the Storefront API.

## Safe to skip when

- The storefront has replaced these routes with its own data layer that already handles empty / errored seed fetches.
- The storefront asserts a non-empty catalog as a deploy precondition and prefers the build to fail loudly when the assumption breaks.

## Tradeoff

The placeholder route prerenders as a 404 shell. On an empty-store build, no real product or collection pages are statically prerendered — the first request to a real handle hits the dynamic path. This is the intended tradeoff: a slower first-request for the empty-store case in exchange for builds that never block on catalog state.

## Validation

1. With a populated store: `pnpm --filter template build` succeeds and prerenders one real product handle and one real collection handle.
2. With Shopify credentials pointed at an empty store (or with the Storefront API blocked): the same build still succeeds and only prerenders the `__placeholder__` shells.
3. Hitting `/products/__placeholder__` or `/collections/__placeholder__` at runtime returns a 404.
