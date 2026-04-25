---
title: Vertical-spacing pilot — home + PDP on grid+gap
changeKey: grid-gap-pilot-home-pdp
introducedOn: 2026-04-25
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/ui/container.tsx
  - apps/template/app/page.tsx
  - apps/template/components/product/products-grid.tsx
  - apps/template/components/product/related-products-section.tsx
  - apps/template/components/product-detail/product-detail-page.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/product-info.tsx
  - apps/template/components/product-detail/color-picker.tsx
  - apps/template/components/product-detail/option-picker.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/AGENTS.md
---

## Summary

The template's vertical-spacing model is shifting away from child-side margins (`mb-*`, `mt-*`) and `space-y-*` (which is still margin-based under the hood) toward **parent-owned** spacing using `display: grid` with a single implicit column and `gap-*`. This entry rolls out the convention to the home page and the PDP. Other pages convert in follow-up PRs.

Concrete changes:

- `Container` now sets `grid gap-10` by default, so its direct children get the canonical vertical rhythm with no extra wrapper.
- Home page (`app/page.tsx`) drops its inner `<div className="flex flex-col gap-10">` wrapper; `ProductsGrid` is now a direct Container child.
- `ProductsGrid`'s outer `<div>` becomes `grid gap-4`; `mb-4` removed from its title row.
- All `space-y-*` on the PDP (page shell, fallback, options, color/option pickers, media) become `grid gap-*` with the same numeric value.
- The `mt-3` between the product title and price moves into the wrapper as `grid gap-2.5`.
- AGENTS.md gains a `Spacing` subsection codifying the convention and the canonical gap scale (`gap-2.5 / 4 / 5 / 10`).

## Why it matters

- Predictable layout: child components no longer push each other around, so reordering or reusing a component doesn't change the rhythm.
- Eliminates margin-collapse and `space-y-*`-vs-grid surprises.
- The 5-column language used by search, the nav megamenu, and the footer all assume CSS gap; this pilot brings the page-level scaffolding in line.

## Apply when

- The storefront still uses the original `Container`, `ProductsGrid`, or PDP components and hasn't customized spacing.
- The storefront wants a single, predictable spacing convention as more pages migrate.

## Safe to skip when

- The storefront has heavily customized the home or PDP layouts and has its own spacing convention.
- The storefront overrides `Container` to disable padding/sizing — the new `gap-10` default will only apply between direct children, so the override may already be a no-op, but verify.

## Validation

1. `pnpm --filter template dev`. Visit `/`. Visual diff against `main`: banner sits flush, products grid below with the same rhythm. Mobile and desktop unchanged.
2. Visit `/products/[handle]`:
   - Loaded state: title → price (gap-2.5), pickers (gap-10 between groups), buy buttons, description, then RelatedProductsSection. Same rhythm as before.
   - Suspense fallback: skeleton shell mirrors the loaded state's rhythm.
3. DevTools: confirm direct children of `<Container>`, the PDP grid wrapper, and the product-info column have no inline `margin-top` / `margin-bottom`.
4. Lint and format clean: `pnpm --filter template lint` / `pnpm --filter template format --check`.

## Follow-ups

- Apply the same convention to search, account, cart, and footer body in subsequent PRs (one page per PR keeps blast radius small).
- After the majority of pages convert, consider adding an oxlint rule banning `\bmb-`, `\bmt-`, `\bspace-y-` in JSX `className` strings (with carve-outs for compound-component internals like `ScrollCarousel`).
