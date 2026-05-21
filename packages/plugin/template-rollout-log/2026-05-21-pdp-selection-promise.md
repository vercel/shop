---
title: Replace PDP variantIdPromise with one ProductSelection promise read at the leaves
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
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/components/product/related-products-section.tsx
  - apps/template/lib/product.ts
---

## Summary

The PDP's per-slot Suspense boundaries (price, options, buy buttons, desktop color images, mobile color images) used to each re-await `variantIdPromise` and re-run `computeInitialSelectedOptions` + `resolveSelectedVariant`. This change consolidates that computation into a single `ProductSelection` shape, computed once per request, that every `Resolved*` leaf reads from.

- `lib/product.ts` exports `ProductSelection = { selectedOptions, selectedVariant, colorImages }` and `computeSelection(product, variantId)`.
- `app/products/[handle]/page.tsx` builds one `selectionPromise = Promise.all([productPromise, variantIdPromise]).then(computeSelection)` and threads it down. `variantIdPromise` no longer leaves the page.
- `ProductDetailSection` keeps the same per-slot Suspense layout as before — title, description, schemas, single-variant options/buttons render eagerly; only the truly variant-dependent slots suspend with structural fallbacks (picker chrome, button-shaped placeholders, color image skeletons).
- `BuyButtonsFallback` is extracted as its own component to keep the section JSX flat.
- `ProductMediaSkeleton` is co-located with `ProductMedia`. The page-level Suspense uses `ProductDetailSectionSkeleton` (composed from the media skeleton + right-rail skeleton blobs) only for the `productPromise`-pending window.
- The page-level outer Suspense moves into `ProductDetailSection` so `ProductDetailPage` is a thin composition shell.
- Schemas (`ProductSchema`, `BreadcrumbSchema`) move from `ProductDetailPage` into the section's resolved content — they need the product anyway.
- `RelatedProductsSection` accepts `handle: string | Promise<string>` so the PDP can pass `handlePromise` directly while `/cart` keeps its plain string.

## Why it matters

The fallback-area minimization that the prior design optimized for is preserved: once `productPromise` resolves, the bulk of the right rail (title, options chrome, button-shaped placeholders, description, schemas) renders, and only the price / options-with-selection / buy-buttons-with-variant / color images flash a small per-slot fallback while `selectionPromise` resolves. The change is purely internal — five `Resolved*` components stop redoing the same computation and the same suspended state lives in one type.

## Apply when

The downstream storefront has not heavily modified `product-detail-section.tsx`. Most edits are straightforward to re-apply because the per-slot Suspense layout is unchanged.

## Safe to skip when

- The fork has replaced `ProductDetailSection` with a custom layout. The helpers (`computeSelection`, `ProductSelection`) are still useful to lift independently.

## Notes

- Behavior under `cacheComponents: true` + `unstable_instant = true` is unchanged: `params` and `searchParams` remain promises threaded down the tree.
- `ProductInfoHeader` in `product-info.tsx` was already dead code before this change and was not touched.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` clean.
2. `pnpm --filter template dev`. Visit:
   - A single-variant product — no per-slot Suspense fallback flashes; everything renders directly once the product loads.
   - A multi-variant product without color partitioning — title/description/schemas/picker chrome/button chrome render with the product; price (if non-uniform) and resolved options/buttons swap in after `selectionPromise` resolves.
   - A multi-variant product with color partitioning — desktop color grid and mobile color carousel slots show a tile skeleton while selection resolves, then color images populate.
3. `/cart` still renders related products beneath the cart (uses the `handle: string` overload).
