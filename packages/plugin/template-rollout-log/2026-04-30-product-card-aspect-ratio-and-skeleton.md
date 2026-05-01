---
title: Product card — aspect ratio prop, skeleton sizing, and skeleton dedup
changeKey: product-card-aspect-ratio-and-skeleton
introducedOn: 2026-04-30
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-card/components.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/product/products-slider.tsx
  - apps/template/components/product/related-products-section.tsx
---

## Summary

Three related edits in one change:

1. **Aspect ratio prop on the product card.** `ProductCard`, `ProductCardSkeleton`, and `ProductsSlider` now accept an optional `aspectRatio: "landscape" | "portrait" | "square"` (default `"square"`). The image container picks the matching `aspect-*` class via a `data-[aspect-ratio=…]` selector. Existing call sites are unaffected — square stays the default.

2. **`ProductCardSkeleton` reserves the right height.** The rendered card title is `line-clamp-2`, but the skeleton was reserving height for one title line plus a short price bar — so the layout shifted upward when data resolved. The skeleton now renders three `h-4` bars (two for the wrapping title, one for the price) inside `py-2.5 h-18 box-content grid gap-2`, matching the actual card.

3. **Collapse the duplicate skeleton in `RelatedProductsSectionSkeleton`.** The related-products fallback was rendering its own inline tile that mirrored what `ProductCardSkeleton` does. Both implementations existed because the per-card skeleton drifted. With the height fix in (2), the related-products skeleton can render `<ProductCardSkeleton aspectRatio={…} />` for each tile and stay in sync automatically. The local `Fallback` helper is renamed to `RelatedProductsSectionSkeleton` and exported so consumers can render it at a parent fallback (e.g. a page-level Suspense) when needed.

## Why it matters

- Aspect ratio is a routine catalog ask (portrait for furniture/apparel, landscape for some banners). The template having to grow this prop ad-hoc per project is friction that shouldn't recur.
- The skeleton height regression caused a one-line layout shift on every product grid the moment data resolved — this was the symptom that surfaced the issue.
- Two skeleton implementations drifted once and would drift again. Routing the related-products section through `ProductCardSkeleton` removes the surface area.

## Apply when

- The storefront uses `ProductCard`, `ProductCardSkeleton`, or `ProductsSlider` directly.
- Or the storefront renders `RelatedProductsSection` and notices a one-line layout jump when recommendations resolve.

## Safe to skip when

- The storefront has already replaced `ProductCardSkeleton` and the related-products fallback with custom skeletons sized to its own card.

## Notes

- The new `ProductCardAspectRatio` type is exported from `components/product-card/components.tsx`.
- `RelatedProductsSectionSkeleton` is now exported and accepts the same `aspectRatio` so a page-level fallback (rendered before the in-component Suspense fires) can reserve the right shape.

## Validation

1. `pnpm --filter template dev`.
2. Home page: confirm the featured-products grid renders without a vertical jump when products resolve. The skeleton bars should fill the same vertical space the title and price take after load.
3. PDP: open a product. The related-products fallback should also have no jump when recommendations resolve.
4. Pass `aspectRatio="portrait"` to a `ProductsSlider` instance and confirm the cards render at 3:4 with the matching skeleton shape.
5. `pnpm --filter template lint` and `tsc --noEmit` clean.
