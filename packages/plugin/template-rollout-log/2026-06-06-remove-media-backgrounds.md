---
title: Remove gray background behind PDP grid and product card media
changeKey: remove-media-backgrounds
introducedOn: 2026-06-06
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/components/product-card/components.tsx
---

## Summary

Two media surfaces no longer paint a gray backing color behind images:

- **PDP desktop grid** (`product-media.tsx`, `GridItem`): the tile dropped `bg-accent` (`#e9e9e9`). It is now `relative w-full overflow-hidden aspect-square`. The mobile carousel already had no background, so the two viewports now match.
- **Product card** (`components.tsx`, `ProductCardImage`): the image container dropped `bg-muted` (`#e9e9e9`). The `bg-muted` moved onto the no-image fallback `<div>` so a product without a `featuredImage` still renders as a gray box with its centered title — only cards that actually have an image lose the backing color.

## Why it matters

- `object-cover` images fully fill the square, so the backing color was only ever visible behind transparent PNGs or during the brief image fetch. On a white page it read as a faint gray frame rather than an intentional surface.
- Removing it lets product imagery sit directly on the page background and keeps the PDP grid and carousel visually consistent.

## Apply when

- The storefront uses the template's `ProductCard` and PDP `ProductMedia` largely as shipped and wants imagery flush on the page background.

## Safe to skip when

- The storefront deliberately wants a gray frame behind product imagery (e.g. for predominantly transparent-PNG catalogs where the backing color provides contrast during load).
- `ProductCardImage` / `GridItem` have been customized with their own background.

## Validation

1. `pnpm --filter template dev`.
2. Load a PDP on desktop (`lg`) and confirm grid tiles have no gray backing behind images; load on mobile and confirm the carousel is unchanged.
3. Load a collection/search grid and confirm product cards with images have no gray backing.
4. Render a product with no `featuredImage` and confirm the fallback still shows a gray (`bg-muted`) box with the title.
5. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit` clean.
