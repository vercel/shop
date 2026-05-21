---
title: Collapse PDP variant-resolution duplication into one ProductSelection
changeKey: pdp-selection-promise
introducedOn: 2026-05-21
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/components/product-detail/product-detail-page.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/product-info.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/components/product/related-products-section.tsx
  - apps/template/lib/product.ts
---

## Summary

Collapses the five `Resolved*` Suspense children inside `ProductDetailSection` (price, options, buy buttons, desktop color images, mobile color images) and their parallel eager paths into a single `ProductSelection` shape resolved once per request.

- `lib/product.ts` now exports `ProductSelection`, `computeSelection(product, variantId)`, and `isSelectionEager(product)`.
- The page builds one `selectionPromise = Promise.all([productPromise, variantIdPromise]).then(computeSelection)` and threads it down. `variantIdPromise` is no longer plumbed beyond the page.
- `ProductDetailSection` branches once per region (`ProductMediaRegion`, `ProductInfoRegion`) on `isSelectionEager`; the eager and async paths now render through the same `ProductInfoColumn`.
- The hand-painted full-page `ProductPageFallback` is gone. Each section owns its own skeleton: `ProductDetailSectionSkeleton`, `ProductMediaSkeleton`, `ProductInfoSkeleton`.
- `RelatedProductsSection` accepts `handle: string | Promise<string>` so the PDP page can pass `handlePromise` directly while the cart page keeps passing a string.

## Why it matters

Each variant-dependent slot used to exist twice — once for the `singleVariant` eager path and once for the Suspense+`Resolved*` path — and the `Resolved*` children each re-awaited `variantIdPromise` and re-ran `computeInitialSelectedOptions`/`resolveSelectedVariant`. The new shape removes ~120 lines of duplication, gives each PDP region a single source of truth for selection state, and pairs every Suspense boundary with a co-located skeleton (the established pattern in `RelatedProductsSection` / `ProductCard`).

## Apply when

- The downstream storefront has not heavily modified `product-detail-section.tsx` or the `Resolved*` components. Most edits to the section file are clean to re-apply on top.

## Safe to skip when

- The fork relies on the previous eager-render behavior for multi-variant uniform-pricing products (price rendered without Suspense fallback). The refactor sends that case through the standard `ProductInfoSkeleton` for the briefest moment before resolution; the simplest reintroduction is a granular `eagerPrice` flag if visually important.
- The fork has replaced `ProductDetailSection` with a custom layout. Pull the helpers (`computeSelection`, `isSelectionEager`) into the fork if useful, but the surrounding wiring will not apply.

## Notes

- Behavior under `cacheComponents: true` + `unstable_instant = true` is unchanged: `params` and `searchParams` are still consumed as promises threaded down the tree, not awaited at the top of the page.
- Slot-level skeletons (`ProductMediaSkeleton`, `ProductInfoSkeleton`) live with their real components for parity. `ProductDetailSectionSkeleton` composes them.
- Schemas (`ProductSchema`, `BreadcrumbSchema`) moved from `ProductDetailPage` into the section's resolved content — they need the product anyway and the page is now a thin composition shell.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` clean.
2. `pnpm --filter template dev`. Visit:
   - A single-variant product — right rail renders without any Suspense fallback flash; media renders directly.
   - A multi-variant product with color partitioning — desktop grid and mobile carousel both swap correctly as variant changes; skeleton renders briefly on first paint before selection resolves.
   - A multi-variant product without color partitioning — media renders eagerly, right rail goes through Suspense.
3. `/cart` still renders related products beneath the cart (uses `handle: string` overload).
