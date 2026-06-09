---
title: Skeleton fallback color — dedicated --skeleton token at #fafafa
changeKey: skeleton-fallback-color
introducedOn: 2026-06-09
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/globals.css
  - apps/template/components/ui/skeleton.tsx
  - apps/template/components/action-bar/predictive-search-results.tsx
  - apps/template/components/cart-page/skeletons.tsx
  - apps/template/components/nav/search-modal.tsx
  - apps/template/components/product-card/components.tsx
---

## Summary

Loading skeletons now use a dedicated `--skeleton` color token set to `#fafafa`, lighter than the previous `#e9e9e9`. A new `--skeleton` CSS variable and `--color-skeleton` theme mapping are registered in `app/globals.css`, exposing a `bg-skeleton` utility.

The shared `Skeleton` component (`components/ui/skeleton.tsx`) switched from `bg-accent` to `bg-skeleton`. The hand-rolled `animate-pulse` placeholders that previously used `bg-muted` — in `predictive-search-results.tsx`, `cart-page/skeletons.tsx`, `nav/search-modal.tsx`, and `product-card/components.tsx` — now use `bg-skeleton` too, so every loading skeleton renders at the same `#fafafa`.

## Why it matters

- Skeletons previously shared the `--accent` / `--muted` tokens (`#e9e9e9`), which are also used for hover states, badges, inputs, and image-placeholder backgrounds. The skeleton color could not be tuned without recoloring all of those.
- A dedicated token decouples the loading-state color from interactive/surface tokens and gives storefronts one obvious place to retheme skeletons.
- `#fafafa` reads as a lighter, less heavy placeholder above the real content.

Note: non-skeleton `bg-muted` usages (image-load backgrounds behind product thumbnails, no-image fallback boxes, badges, inputs) are intentionally left unchanged — only pulsing loading skeletons moved to `bg-skeleton`.

## Apply when

- The storefront still uses the shared `Skeleton` component and/or the template's loading placeholders largely as shipped.
- The storefront wants skeletons themed independently from `--accent` / `--muted`.

## Safe to skip when

- The storefront has already customized its skeleton color or replaced the skeleton components with a custom loading treatment.

## Validation

1. `pnpm --filter template dev`.
2. Trigger loading states (PLP/product grid, predictive search, search modal, cart page) and confirm skeletons render at `#fafafa`.
3. Confirm hover states (outline/ghost buttons, dropdown/menu items, account sidebar) and image-placeholder backgrounds are visually unchanged.
4. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit` clean.

## See also

- `banner-default-foreground` (2026-06-04) — another default visual change leaning on theme tokens.
