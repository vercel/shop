---
title: Skeleton fallback color — lighten --accent to #efefef
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

Loading skeletons are lightened from `#e9e9e9` to `#efefef` by bumping the `--accent` token in `app/globals.css`. All skeletons now key off `--accent` for a single source of truth: the shared `Skeleton` component (`components/ui/skeleton.tsx`) keeps `bg-accent`, and the hand-rolled `animate-pulse` placeholders in `predictive-search-results.tsx`, `cart-page/skeletons.tsx`, `nav/search-modal.tsx`, and `product-card/components.tsx` move from `bg-muted` to `bg-accent` so every skeleton renders the same shade.

Because `--accent` is shared, the same `#e9e9e9` → `#efefef` lightening also applies to accent-backed hover/focus states (outline/ghost buttons, dropdown/menu/select items, command palette, account sidebar active item) and the color-picker fallback swatch. The shift is subtle and intentional.

## Why it matters

- Skeletons previously rendered via two tokens that happened to share a value (`--accent` and `--muted`, both `#e9e9e9`). Unifying on `--accent` means skeleton color is tunable from one place.
- `#efefef` is a slightly lighter placeholder. (An earlier pass tried `#fafafa` via a dedicated `--skeleton` token; that read too light, so the token was dropped in favor of reusing `--accent`.)

## Apply when

- The storefront still uses the shared `Skeleton` component and/or the template's loading placeholders largely as shipped.
- The storefront is comfortable with accent-backed hover/focus states lightening by the same small amount.

## Safe to skip when

- The storefront has already customized `--accent` or replaced the skeleton components with a custom loading treatment.

## Validation

1. `pnpm --filter template dev`.
2. Trigger loading states (PLP/product grid, predictive search, search modal, cart page) and confirm skeletons render at `#efefef`.
3. Confirm accent-backed hover/focus states still look correct at the lighter value.
4. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit` clean.

## See also

- `banner-default-foreground` (2026-06-04) — another default visual change leaning on theme tokens.
