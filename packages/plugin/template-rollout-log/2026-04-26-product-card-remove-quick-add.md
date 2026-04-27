---
title: Product card — remove quick-add button
changeKey: product-card-remove-quick-add
introducedOn: 2026-04-26
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/product-card/components.tsx
  - apps/template/components/product-card/quick-add.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/lib/product.ts
  - apps/docs/content/docs/anatomy/pages/home.mdx
  - apps/docs/content/docs/anatomy/pages/plp.mdx
---

## Summary

The product card on the home grid and PLP rendered a hover-revealed quick-add button (`components/product-card/quick-add.tsx`) that always added the product's `defaultVariantId` with quantity 1. The control did not surface variant selection (size, color, etc.), so for any multi-variant product it added an arbitrary default variant rather than the one the shopper would have picked on the PDP. It was also gated to hover (`[@media(hover:hover)]:group-hover`), which means it never appeared on touch devices — i.e. mobile shoppers had no equivalent affordance at all.

This change removes the feature end-to-end:

- Deletes `components/product-card/quick-add.tsx`.
- Drops the `ProductCardQuickAdd` import and JSX from `components/product-card/product-card.tsx` and `components/collections/infinite-product-grid.tsx`.
- Removes the now-unused `children` prop from `ProductCardImage` and the unused `group` class on the `ProductCard` `<article>` wrapper in `components/product-card/components.tsx`. (`group/image` on the image div is preserved — the slideshow still uses it.)
- Drops `productCardToOptimisticInfo` from `lib/product.ts`. `OptimisticProductInfo` and `variantToOptimisticInfo` stay; both are still used by the PDP buy buttons and cart context.
- Updates `apps/docs/content/docs/anatomy/pages/{home,plp}.mdx` to drop the quick-add bullet and key-files description.

The shared `cart.addToCart` and `product.addToCart` i18n keys are kept — both are still referenced by the PDP buy buttons (`components/product-detail/buy-buttons.tsx`) and the agent flow.

## Why it matters

- A "1-click add" that ignores variant selection misleads shoppers on multi-variant SKUs and creates support load when the wrong variant lands in the cart.
- The control was desktop-hover-only, so the PLP had a feature on desktop that did not exist on mobile — divergent UX with no mobile story.
- Re-introducing a real story would mean a variant disambiguation flow (popover or inline picker) and a mobile-first interaction. That is a larger design exercise that does not need to live behind a half-implemented hover button in the meantime.

## Apply when

- The storefront has not built a custom variant-aware quick-add flow on top of `ProductCardQuickAdd`.
- Product cards in the storefront still pass through `components/product-card/product-card.tsx` and/or the `ClientProductCard` in `components/collections/infinite-product-grid.tsx`.

## Safe to skip when

- The storefront has already replaced `ProductCardQuickAdd` with a variant-aware flow (e.g. an in-card picker) and intentionally exposes it on mobile too.
- The storefront has decided that defaulting to `defaultVariantId` is acceptable for its catalog (single-variant-dominant) and wants to keep the existing button.

## Notes

- Downstream storefronts that import `productCardToOptimisticInfo` from `@/lib/product` will need to remove those call sites. `OptimisticProductInfo` and `variantToOptimisticInfo` are unchanged.
- If a storefront still wants the button, it can keep its local copy of `quick-add.tsx` and the import — nothing about the cart context API changed.

## Validation

1. `pnpm --filter template dev`.
2. Home page and any `/collections/[handle]` page: hover a product card on desktop — confirm no button appears in the bottom-right of the image. The hover slideshow on multi-image cards should still work.
3. Mobile width: same pages — confirm the card image renders cleanly with no leftover absolutely-positioned children.
4. PDP: open a product, pick a variant, add to cart — confirm the cart context flow still works (this path uses `variantToOptimisticInfo`, not the removed helper).
5. `pnpm --filter template lint` — confirm no unused imports remain (the `ProductCardBadge` import in `infinite-product-grid.tsx` was already unused and is removed in the same change).
