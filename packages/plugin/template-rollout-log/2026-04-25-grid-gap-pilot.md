---
title: Sections primitive — vertical-spacing pilot on home & PDP
changeKey: sections-pilot-home-pdp
introducedOn: 2026-04-25
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/ui/container.tsx
  - apps/template/components/ui/sections.tsx
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

Vertical rhythm between page sections moves from child-side margins (`mb-*`, `mt-*`) and `space-y-*` to a small parent primitive: **`Sections`** (`components/ui/sections.tsx`). It's a `<div className="grid gap-10">` wrapper that overrides cleanly via `className`. `Container` keeps its narrow role — horizontal padding + max-width — and no longer carries any vertical opinion.

This entry rolls out the convention to the home page and the PDP. Other pages stay on prior patterns until follow-up PRs.

Concrete changes:

- New `<Sections>` primitive, default `grid gap-10`, override via `className`.
- `app/page.tsx` wraps banner + Container in `<Sections>` so full-bleed and constrained children compose freely.
- PDP `ProductContent` and the Suspense fallback shell use `<Sections>` for inter-section rhythm. Inner column layouts (sticky right column with title → options → buy → description) use plain `grid gap-*`.
- The product title and price sit flush, matching production. The pilot's earlier accidental `gap-2.5` between them is removed.
- `space-y-*` and `flex flex-col gap-*` inside the PDP files (color/option pickers, product-media, related-products skeleton) are normalized to `grid gap-*` — internal layout improvements that don't affect inter-section rhythm.
- `products-grid` outer becomes `grid gap-4`; the `mb-4` on the title row is gone.
- AGENTS.md gains a `Spacing` subsection codifying the rule and the canonical scale (`gap-2.5 / 4 / 5 / 10`).

## Why it matters

- Predictable layout: child components no longer push each other around, so reordering or reusing them doesn't change the rhythm.
- `Container` and `Sections` have orthogonal responsibilities. A page can interleave full-bleed sections (a hero strip, a marketing banner) with constrained `<Container>` children inside the same `<Sections>`.
- Per-page rhythm is a one-prop override (`<Sections className="gap-5">`) rather than a Container API negotiation.

## Apply when

- The storefront still uses the original `Container`, `ProductsGrid`, or PDP components and hasn't customized spacing.
- The storefront wants a single, predictable spacing convention as more pages migrate.

## Safe to skip when

- The storefront has heavily customized the home or PDP layouts and has its own spacing convention.

## Validation

1. `pnpm --filter template dev`. Visit `/`. Visual diff against `main`: banner + featured products grid, same rhythm. Mobile and desktop unchanged.
2. Visit `/products/[handle]`:
   - Title and price flush — no extra gap between them.
   - Sticky right column rhythm matches production (title-price → options → buy → description).
   - RelatedProductsSection sits below ProductDetailSection with `gap-10`.
   - Suspense fallback mirrors loaded rhythm.
3. Visit `/collections/[handle]` and `/search?q=beds`. Rhythm matches `main` — Container is back to horizontal-only, so pages that haven't migrated keep their original spacing.
4. DevTools:
   - `<Container>` has no `display: grid` and no inline gap.
   - `<Sections>` instances have `display: grid; gap: 40px;` (or override).
5. Lint and format clean: `pnpm --filter template lint` / `pnpm --filter template format --check`.

## Follow-ups

- Apply `<Sections>` to search, collection, account, cart, footer body in subsequent PRs (one page per PR keeps blast radius small). Each page gets to pick its own gap (`gap-5` for collection's filter→grid pairing, etc.).
- After the majority of pages convert, consider an oxlint rule banning `\bmb-`, `\bmt-`, `\bspace-y-` in JSX `className` strings (with carve-outs for compound-component internals like `ScrollCarousel`).
