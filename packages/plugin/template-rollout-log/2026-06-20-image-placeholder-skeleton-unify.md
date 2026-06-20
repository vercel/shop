---
title: Unify the no-image placeholder and loading skeletons on ImagePlaceholder
changeKey: image-placeholder-skeleton-unify
introducedOn: 2026-06-20
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/ui/image-placeholder.tsx
  - apps/template/components/product-card/components.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/docs/content/docs/anatomy/product-card.mdx
---

## Summary

The no-image placeholder and the image-area loading skeletons now render the same element, so the empty state reads as a settled version of the loading state.

- `ImagePlaceholder` (`components/ui/image-placeholder.tsx`) tints its Lucide `ImageIcon` with the skeleton color: `text-muted-foreground/40` → `text-accent` (`--accent`, `#efefef`). The icon now matches the fill color of the shared `Skeleton`.
- `ProductCardSkeleton` (`product-card/components.tsx`) replaces its solid `bg-accent animate-pulse` image block with `<ImagePlaceholder className="animate-pulse …" />` carrying the same `data-aspect-ratio` footprint.
- `ProductMediaSkeleton` (`product-detail/product-media.tsx`) replaces its `<Skeleton>` gallery tiles with `<ImagePlaceholder className="aspect-square w-full animate-pulse" />`. The now-unused `Skeleton` import is dropped from that file.

The net effect: a loading product card/gallery and a no-image product card/gallery render the identical white box with a faint accent image icon — the only difference is the loading variant pulses via `animate-pulse`.

## Why it matters

- Loading and empty states were two different visuals (a solid accent block vs. a white box with a muted dark icon). Unifying them removes the visual "jump" between a skeleton and a product that turns out to have no image, and gives both states a single source of truth.
- The icon color is keyed to `--accent` (the same token the skeletons use, see `skeleton-fallback-color`), so retuning skeleton color retunes the placeholder icon with it.

## Apply when

- The storefront still uses `ImagePlaceholder`, `ProductCardSkeleton`, and `ProductMediaSkeleton` largely as shipped (see `no-image-placeholder` and `product-card-aspect-ratio-and-skeleton`).

## Safe to skip when

- The storefront has customized the placeholder icon color or replaced the image skeletons with a bespoke loading treatment.

## Validation

1. `pnpm --filter template dev`.
2. Trigger product-grid and PDP loading states (infinite scroll, navigation) and confirm the image areas pulse as a white box with a faint accent image icon rather than a solid accent block.
3. Open a product with no featured image and no gallery media; confirm the card and PDP show the same box, static (no pulse).
4. `pnpm --filter template lint` and `pnpm --filter docs build` clean.

## See also

- `no-image-placeholder` (2026-06-19) — introduced the shared `ImagePlaceholder`.
- `skeleton-fallback-color` (2026-06-09) — unified skeletons on `--accent` (`#efefef`).
- `product-card-aspect-ratio-and-skeleton` (2026-04-30) — the aspect-ratio-aware card skeleton.
