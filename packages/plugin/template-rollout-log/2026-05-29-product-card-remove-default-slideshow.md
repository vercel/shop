---
title: Product card — remove default hover image carousel
changeKey: product-card-remove-default-slideshow
introducedOn: 2026-05-29
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-card/slideshow.tsx
  - apps/template/components/product-card/components.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/lib/types.ts
  - apps/docs/content/docs/anatomy/product-card.mdx
  - apps/docs/content/docs/anatomy/pages/home.mdx
  - apps/docs/content/docs/anatomy/pages/plp.mdx
---

## Summary

The product card on the home grid, PLP/search grids, and infinite-scroll batches rendered a desktop-only, hover-revealed image carousel (`components/product-card/slideshow.tsx`) that scrolled through a product's additional images. This change removes that feature as a default — cleanly, including the data it consumed.

What changed:

- Deletes `components/product-card/slideshow.tsx`.
- Removes the `ProductCardSlideshow` import, the `images` prop on `ProductCardImage`, the `hasSlideshow` logic, and the slideshow render from `components/product-card/components.tsx`. The now-orphaned `group/image` class on the image wrapper is dropped (only the slideshow used `group-hover/image`).
- Drops `images={product.images}` from the two card call sites: `components/product-card/product-card.tsx` and the `ClientProductCard` in `components/collections/infinite-product-grid.tsx`.
- Removes the `images(first: 5)` block **and** the `variants(first: 50)` block from `PRODUCT_CARD_FRAGMENT` in `lib/shopify/fragments.ts`. The `variants` block existed only to let the transform exclude variant-specific images from the carousel.
- Removes `images: filterVariantImages(product)` from `transformShopifyProductCard` and deletes the now-unused `filterVariantImages` helper in `lib/shopify/transforms/product.ts`. Also drops the orphaned `images?` and `variants?` fields from the `ShopifyProductCard` response interface.
- Removes `images: Image[]` from the `ProductCard` domain type in `lib/types.ts`. `ProductDetails` keeps its own `images` (sourced from the `media` field), so the PDP gallery is unaffected.
- Adds a new `apps/docs/content/docs/anatomy/product-card.mdx` page documenting the card and providing a copyable "Add a hover image carousel" recipe prompt, and updates the home/PLP anatomy pages to drop the slideshow claims and link to it.

## Why it matters

- `ProductCard.images` was consumed only by the carousel. Once the carousel is gone, fetching `images(first: 5)` plus up to 50 variants' image URLs on every card is pure over-fetch — wasted query cost and payload on every grid render.
- The carousel was desktop-hover-only (`[@media(hover:hover)]:group-hover/image`), so it never appeared on touch devices — a feature that existed on desktop with no mobile equivalent.
- Keeping a single featured image per card makes grids lighter and the default behavior easier to reason about. Storefronts that want the carousel can re-add it deliberately via the documented recipe.

## Apply when

- Product cards in the storefront still pass through `components/product-card/product-card.tsx` and/or the `ClientProductCard` in `components/collections/infinite-product-grid.tsx`.
- The storefront has not built custom behavior on top of `ProductCard.images` or the `ProductCardSlideshow` component.

## Safe to skip when

- The storefront has customized the hover carousel (e.g. enabled it on mobile, changed its data source) and wants to keep it.
- The storefront reads `ProductCard.images` elsewhere (e.g. a custom quick-look or zoom feature) and still needs the card-level images array fetched.

## Notes

- Downstream storefronts that read `product.images` off card-shaped data (the `ProductCard` type) will hit a type error after adopting — remove those reads, or keep the field by following the recipe. `ProductDetails.images` is unchanged.
- The carousel can be restored end-to-end using the "Add a hover image carousel" recipe in `apps/docs/content/docs/anatomy/product-card.mdx`, which re-adds the fragment fields, the transform/type changes, the `slideshow.tsx` component, and the wiring.

## Validation

1. `pnpm --filter template dev`.
2. Home page and any `/collections/[handle]` page: hover a multi-image product card on desktop — confirm no carousel fades in over the image.
3. A product with no image: confirm the card still shows the muted title-text fallback in the image box.
4. Mobile width: confirm cards render cleanly with no leftover absolutely-positioned children.
5. PDP: open a product — confirm the image gallery still works (it uses the separate `media` field, not the card fragment).
6. `pnpm --filter template lint` and `pnpm --filter template build` — confirm no unused imports or type errors.
