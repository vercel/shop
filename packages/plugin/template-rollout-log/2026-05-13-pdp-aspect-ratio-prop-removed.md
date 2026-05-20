---
title: Remove aspectRatio prop from PDP gallery — inline aspect-square
changeKey: pdp-aspect-ratio-prop-removed
introducedOn: 2026-05-13
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-page.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/components/product-card/components.tsx
---

## Summary

Reverts the runtime `aspectRatio` prop on the PDP gallery added in [pdp-aspect-ratio-and-oos-slideshow](./2026-05-04-pdp-aspect-ratio-and-oos-slideshow.md). The prop was threaded through five layers (`ProductDetailPage` → `ProductContent` → `ProductDetailSection` → `ProductMedia` → `Carousel`/`Grid`/inner items, plus `ColorImageGrid` and `ColorImageCarouselItems`) for a single PDP route that never overrode the default. PDP markup now hardcodes `aspect-square` at each call site. `data-aspect-ratio` attributes on PDP elements are dropped along with the selector-based `aspectRatioClasses` class string indirection.

The product-card side is unchanged: `ProductCard`, `RelatedProductsSection`, and `ProductsSlider` still accept `aspectRatio?: "landscape" | "portrait" | "square"` because product cards render in multiple grids (collections, search, related, featured) with genuine per-surface variability. `aspectRatioClasses` is no longer exported from `components/product-card/components.tsx` because nothing outside that file imports it anymore.

The OOS slideshow change from the 2026-05-04 entry is unrelated and stays in place.

## Why it matters

The PDP has one route and one call site. A prop API exists to support multiple call sites passing different values at runtime — a forkable template doesn't need that machinery for a knob nobody calls. Customization at fork time is a source edit, not a runtime contract. The drilling is the smell that prompted the revert; collapsing the indirection removes ~9 prop declarations, three default values, and one cross-module import.

A storefront that wants a non-square PDP edits `aspect-square` in `components/product-detail/*` — same number of edits as previously passing a prop on `<ProductDetailPage>`, with no API to maintain.

## Apply when

- The downstream storefront never set `aspectRatio` on `<ProductDetailPage>` (true for everything that adopted the 2026-05-04 default).
- Or the storefront wants to simplify the PDP gallery code path.

## Safe to skip when

- The storefront already passes a non-square `aspectRatio` to `<ProductDetailPage>` and relies on it. In that case, either keep the prop locally, or replace the `aspect-square` occurrences in the three PDP files with `aspect-[4/3]` / `aspect-[3/4]` to match the previous behavior.
- The storefront has replaced `ProductMedia` with a custom implementation.

## Notes

- The `ProductCardAspectRatio` type stays exported because product cards still use it.
- If a fork wants both PDP and card to track the same shape, define `const PDP_ASPECT_RATIO: ProductCardAspectRatio = "portrait"` in the fork's code and reference it from the PDP files. Not added by default since the template has one PDP shape.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` clean.
2. `pnpm --filter template dev`. Visit a PDP — mobile carousel items, desktop 2×2 grid items, the Suspense skeletons, and the color-image slot fallback all render as 1:1 (`aspect-square`). Layout shift between fallback and resolved content unchanged.
3. Visit a collection page — product cards still respect their own `aspectRatio` prop (if any caller sets it). The card-side API surface is unaffected.
