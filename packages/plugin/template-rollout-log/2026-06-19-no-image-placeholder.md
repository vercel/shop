---
title: No-image placeholder — shared ImagePlaceholder for cards and the PDP gallery
changeKey: no-image-placeholder
introducedOn: 2026-06-19
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/ui/image-placeholder.tsx
  - apps/template/components/product-card/components.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/components/agent/registry.tsx
  - apps/template/components/product-detail/bundle-components.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/docs/content/docs/anatomy/product-card.mdx
  - apps/docs/content/docs/anatomy/pages/home.mdx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

Products with no imagery now render a consistent placeholder instead of ad-hoc text or an empty layout.

- New shared primitive `ImagePlaceholder` (`components/ui/image-placeholder.tsx`): a white square that centers a muted Lucide `ImageIcon`. The icon is sized relative to the box (`w-1/3`, capped at `10rem`), so the same component reads correctly at card scale and at PDP-gallery scale.
- `ProductCardImage` renders `ImagePlaceholder` (filling the aspect-ratio box) when `featuredImage` is missing, replacing the previous `bg-muted` box that showed the product title as placeholder text. The now-unused `fallbackTitle` prop is removed from `ProductCardImage` and its call sites.
- `ProductMedia` no longer returns `null` when a product has no images or videos. It renders a single `ImagePlaceholder` at the gallery's `aspect-square` footprint — full-bleed on mobile (`-mx-5`), full-width within the media column on desktop — so the PDP keeps its two-column shape.
- The PDP bundle lists ("Bundle includes" / "Available in bundles", `bundle-components.tsx`) render a `size-12` `ImagePlaceholder` for a component or parent with no image instead of dropping the thumbnail, so rows stay aligned.

## Why it matters

A missing image previously produced two different, weaker outcomes: cards fell back to centered title text (visually noisy, duplicated the title shown below), and the PDP gallery rendered nothing, collapsing the two-column layout and leaving the buy column floating. A single placeholder primitive makes the empty state intentional and keeps grids and the PDP layout aligned.

## Apply when

- The storefront's catalog can contain products without a featured image or gallery media (common during merchandising, draft products, or partial imports).
- You want a uniform empty-image treatment shared across cards and the PDP.

## Safe to skip when

- Every product is guaranteed to have imagery, or a custom empty-state treatment is already in place.

## Adoption notes

- `ImagePlaceholder` lives in `components/ui/` and takes primitive props only (`className`, `iconClassName`, plus native `div` props) — no domain types. The caller owns sizing: cards pass `size-full`; the PDP passes the `aspect-square` breakout classes.
- `ProductCardImage` no longer accepts `fallbackTitle`. Remove that prop from any local call sites.
- The icon is decorative (`aria-hidden`); the accessible product name still comes from the card title / PDP `<h1>`, so no new strings are introduced.

## Validation

1. Open a product with no featured image in a grid (home, collection, search) and confirm the card shows the white square with the centered image icon, with the title and price still below.
2. Open a product with no gallery media on the PDP and confirm a single square placeholder fills the media column (full-bleed on mobile) and the buy column stays in place.
3. Run `pnpm --filter template lint`, `pnpm --filter template build`, and `pnpm --filter docs build`.
