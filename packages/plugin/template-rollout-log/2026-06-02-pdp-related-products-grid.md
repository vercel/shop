---
title: Related products — switch from slider to 4-up grid
changeKey: pdp-related-products-grid
introducedOn: 2026-06-02
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product/related-products-section.tsx
  - apps/template/components/product/products-slider.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

`RelatedProductsSection` now renders a fixed 2/4-column grid of up to four product cards instead of a horizontally scrolling slider. Concretely:

- A `RECOMMENDATION_LIMIT` of `4` is applied via `recommendations.slice(0, 4)`. The Shopify recommendation API still returns its usual ~10 — only the first four are rendered.
- The slider markup (`ProductsSlider` + the full-bleed `auto-cols-[58.33vw]` overflow grid) is replaced with `grid grid-cols-2 gap-5 lg:grid-cols-4`, matching the `FeaturedProducts` grid on the home page.
- The fallback skeleton mirrors the loaded layout (four `ProductCardSkeleton`s in the same 2/4-col grid) instead of the prior carousel skeleton.
- `components/product/products-slider.tsx` is deleted — it had only one consumer (this section). The underlying `Slider` primitive in `components/ui/slider.tsx` is untouched and remains available for other carousel needs.
- The `aspectRatio` prop on the exported skeleton is gone; no caller passed it, and the grid uses the default square card.

Both PDP and cart page consume the same `RelatedProductsSection` component, so the cart's "you might also like" surface gets the same treatment.

## Why it matters

- The slider competed visually with the collection grid above and below it on the PDP, suggesting "another browse surface" rather than "a small footer of suggestions." A capped 4-up grid reads as ancillary.
- Fewer cards reduces request and image fan-out per PDP view.
- Removing the full-bleed carousel CSS (`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen`) simplifies the section's interaction with `<Container>` — it now respects container padding like every other section, eliminating one of the last full-bleed-inside-container patterns.

## Apply when

- The storefront still uses `RelatedProductsSection` largely as shipped.
- The storefront doesn't need a horizontally scrollable recommendations strip (e.g. is not surfacing 10+ recommendations in a swipe-able row).

## Safe to skip when

- The storefront has its own related-products layout that wants more than four cards or a scrollable row.
- The storefront imports `ProductsSlider` from `components/product/products-slider.tsx` elsewhere — restore the file (it was a thin wrapper around `Slider` primitives) or migrate those call sites to use `Slider` directly.

## Validation

1. `pnpm --filter template dev`. Visit a PDP (`/products/[handle]`). Below the product detail section, confirm the "You may also like" heading renders followed by a 2-column grid on mobile and a 4-column grid at `lg:` and up, with at most four cards.
2. Visit `/cart` with at least one item. The same 4-up grid renders below the cart summary, anchored to `cart.lines[0].merchandise.product.handle`.
3. Throttle the network in DevTools and reload — the Suspense fallback shows four `ProductCardSkeleton`s in the same grid, not a carousel skeleton.
4. `pnpm --filter template lint` / `pnpm --filter template format --check` are clean.
