---
title: PDP empty gallery renders the placeholder as a single non-zoomable grid item
changeKey: pdp-empty-gallery-single-item
introducedOn: 2026-06-20
changeType: enhancement
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-media.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

When a product has no images or videos, the PDP gallery now renders the placeholder as if it were the gallery's only image, instead of a bespoke full-bleed block.

- `ProductMedia` no longer early-returns a special full-width `ImagePlaceholder` (`aspect-square -mx-5 w-[calc(100%+2.5rem)] lg:mx-0 lg:w-full`). Instead it synthesizes a single `{ type: "placeholder" }` media item and routes it through the same `Carousel` (mobile) and `Grid` (desktop) paths as real media.
- A new `placeholder` variant on the internal `MediaItem` union is rendered as `<ImagePlaceholder className="size-full" />` inside the standard `aspect-square` item wrapper — so it occupies one `aspect-square` cell in the desktop 2-column grid and one full-bleed item in the mobile carousel, exactly like a one-image product.
- The placeholder renders **without** a `LightboxTrigger`, and `Grid` gained an `interactive` prop so the empty case skips the `Lightbox` wrapper entirely (there is nothing to enlarge). Mobile already hides the single dot indicator (`itemCount <= 1`).

## Why it matters

- The empty gallery previously used a one-off full-width layout that diverged from how a real single-image product renders. Reusing the grid/carousel path means a zero-image product and a one-image product share the same structure, and the placeholder inherits the gallery's sizing/snap behavior for free.
- Gating the `Lightbox` wrapper on `interactive` keeps the "no image" state free of a dead zoom affordance.

## Apply when

- The storefront catalog can contain products with no gallery media, and you want the empty PDP gallery to match the one-image layout rather than a full-width block.

## Safe to skip when

- The storefront has customized `ProductMedia` (e.g. a bespoke empty-gallery treatment) or relies on the previous full-width placeholder footprint.

## Adoption notes

- The change is internal to `ProductMedia`; its public props (`otherImages`, `videos`, `title`, `className`, `desktopSlot`, `mobileSlot`) are unchanged.
- On desktop the placeholder is now a half-width grid cell (one of two columns), not full-width. This is the intended "acts like one image" look; storefronts wanting a full-width empty state should override `ProductMedia`.

## Validation

1. Open a product with no images or videos on the PDP.
2. Desktop: confirm a single `aspect-square` placeholder cell sits in the 2-column grid with no zoom cursor and no lightbox on click.
3. Mobile: confirm a single full-bleed placeholder with no dot indicator.
4. `pnpm --filter template lint`, `pnpm --filter template exec tsc --noEmit`, and `pnpm --filter docs build` clean.

## See also

- `image-placeholder-skeleton-unify` (2026-06-20) — the placeholder/skeleton visual unification this builds on.
- `no-image-placeholder` (2026-06-19) — introduced the shared `ImagePlaceholder` and the PDP full-bleed empty state this replaces.
- `pdp-aspect-ratio-and-oos-slideshow` (2026-05-04) — the gallery's grid/carousel structure.
