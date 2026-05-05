---
title: PDP related products — drop dynamic IO so the section prerenders into the cached shell
changeKey: pdp-related-products-static
introducedOn: 2026-05-05
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product/related-products-section.tsx
---

## Summary

`RelatedProductsSection` previously called `await connection()` before fetching recommendations, which marked the subtree as a dynamic IO hole and forced it to render at request time even though `getProductRecommendations()` is wrapped in `"use cache: remote"` with `cacheLife("max")`. The `connection()` call has been removed so the section prerenders into the cached page shell alongside the rest of the PDP. The `Suspense` boundary and skeleton fallback are unchanged.

## Why it matters

- Faster PDP renders: the recommendations slider arrives with the page instead of streaming in after the dynamic hole resolves.
- Lower function invocations: the section is served from cache instead of executing on every request.

## Apply when

- The storefront does not personalize related products per user (e.g., no per-session ranking or A/B variant injected at request time).
- The site is not high-traffic enough to depend on `cacheTag` invalidation rewrites firing on every PDP visit; cached recommendations are acceptable until the next tag-driven revalidation.

## Safe to skip when

- The storefront has wired personalization or per-request signals into the recommendations query and needs the response computed at request time.
- The storefront intentionally wants the section to render after the rest of the page (e.g., to deprioritize the request).

## Validation

1. `pnpm --filter template lint` and `tsc --noEmit` clean.
2. `pnpm --filter template build`. Confirm the PDP route is still buildable with `cacheComponents: true` and the related products section does not trigger a dynamic-IO bailout warning.
3. Open a PDP in `pnpm --filter template start`. The recommendations slider should be present in the initial HTML rather than appearing after a Suspense flush.
