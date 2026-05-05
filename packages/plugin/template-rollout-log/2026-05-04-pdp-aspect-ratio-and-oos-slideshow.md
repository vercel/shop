---
title: PDP gallery aspect ratio prop + suppress hover slideshow on out-of-stock cards
changeKey: pdp-aspect-ratio-and-oos-slideshow
introducedOn: 2026-05-04
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-card/components.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/product-detail-page.tsx
---

## Summary

Two related edits, both layered on top of the earlier ProductCard `aspectRatio` prop (rolled out 2026-04-30):

1. **PDP gallery now accepts `aspectRatio`.** `ProductDetailPage`, `ProductDetailSection`, and `ProductMedia` take an optional `aspectRatio: "landscape" | "portrait" | "square"` (default `"square"`). The mobile carousel items, the desktop 2×2 grid items, and the color-image slot helpers all pick the matching `aspect-*` class via the same `data-[aspect-ratio=…]` selector pattern as the product card. The Suspense fallback skeletons (page-level and color-slot-level) match. The lightbox modal is intentionally left alone — it still fills the viewport with `object-contain` so the full image is always visible at any aspect.

2. **Out-of-stock cards no longer reveal the hover slideshow.** `ProductCardImage` previously rendered `ProductCardSlideshow` regardless of stock state. Because the OOS overlay is `bg-black/60` (translucent), users hovering an OOS card on `lg+` saw images cycling underneath the dim overlay. Slideshow rendering is now skipped when `outOfStock` is true, which also avoids the wasted `next/image` requests for the non-featured images.

## Why it matters

- The earlier rollout exposed `aspectRatio` on the card but not on the PDP gallery, so a storefront picking portrait or landscape product cards had no way to make the PDP match. This is a routine catalog ask and shouldn't have to be re-plumbed per fork.
- The OOS hover behavior was a polish bug — slideshow images cycling under a "Sold out" tint reads as broken state. Suppressing the slideshow in this case is the simplest fix and has no other side effects.

## Apply when

- The storefront renders `ProductDetailPage` (default) and either picks a non-square `aspectRatio` for product cards or wants the option to.
- Or the storefront renders `ProductCard` for products with multiple images and out-of-stock variants.

## Safe to skip when

- The storefront has already replaced `ProductMedia` or `ProductCardImage` with custom implementations.

## Notes

- `aspectRatioClasses` is now exported from `components/product-card/components.tsx` so reusing the same class string elsewhere (PDP gallery, page-level fallback) doesn't require duplicating the selector.
- The type stays named `ProductCardAspectRatio` even though it's now used outside product cards. Renaming would touch every existing consumer for no behavior gain.
- No call site needs updating — the default of `"square"` preserves existing rendering exactly. To change it, pass `aspectRatio="portrait"` (or `"landscape"`) to `<ProductDetailPage>` in `app/products/[handle]/page.tsx`.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` clean.
2. `pnpm --filter template dev`. Visit a PDP with multiple images.
   - Default (`square`): gallery items unchanged from current.
   - Pass `aspectRatio="portrait"` on `<ProductDetailPage>` and confirm the carousel slides and the 2×2 grid items become 3:4. Click a grid item — the lightbox modal still fills the viewport unchanged.
3. On a collection or search grid at `lg+`, hover an out-of-stock product card with multiple images. No slideshow images cycle behind the dim overlay.
