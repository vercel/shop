---
title: Sections — finish rollout to collection / search / cart / account / footer
changeKey: sections-rollout-complete
introducedOn: 2026-04-26
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
  - apps/template/app/account/(authenticated)/layout.tsx
  - apps/template/app/cart/page.tsx
  - apps/template/app/search/page.tsx
  - apps/template/components/account/page-header.tsx
  - apps/template/components/cart-page/empty-cart.tsx
  - apps/template/components/cart-page/header.tsx
  - apps/template/components/cart-page/skeletons.tsx
  - apps/template/components/collections/collection-page.tsx
  - apps/template/components/layout/footer/index.tsx
---

## Summary

Finishes the `<Sections>` primitive rollout. The earlier pilot landed `Sections` and migrated home + PDP; collection / search / cart / account / footer were explicitly deferred. This change brings them in line with the convention:

- `Container` is horizontal padding + max-width only.
- `<Sections>` (default `gap-10`, override via `className`) owns inter-section vertical rhythm.
- Inside a single section, prefer `grid gap-*` on the immediate parent.
- No `mb-*` / `mt-*` / `my-*` / `space-y-*` on children for inter-sibling spacing.

Per-area changes:

- **Cart page** (`app/cart/page.tsx`, `components/cart-page/{header,empty-cart,skeletons}.tsx`): wrap composition in `<Sections>`, collapse `lg:grid lg:grid-cols-12 lg:gap-10` + `mt-10 lg:mt-0` aside reflow into a single `grid gap-10 lg:grid-cols-12` (gap-10 stacks vertically on mobile, horizontally on lg+). Drop `mb-8 lg:mb-12` from the cart `Header`. Drop `mb-6` from the empty-cart h2 in favor of `gap-5` on the flex parent. `PageSkeleton` now wraps in its own `<Container>` + `<Sections>` so the Suspense fallback geometry matches the loaded page.
- **Account** (`app/account/(authenticated)/layout.tsx`, `components/account/page-header.tsx`): drop `mb-6` from `AccountPageHeader`; lift a `<Sections className="gap-5">` wrapper into the layout so every account page (`/account/profile`, `/account/orders`, `/account/addresses`, `/account/orders/[id]`) automatically gets the rhythm without per-page edits.
- **Collection page** (`components/collections/collection-page.tsx`): wrap title + results in `<Sections className="gap-5">`. Drop `mb-6` from `CollectionTitle` and `CollectionTitleSkeleton`.
- **Search page** (`app/search/page.tsx`): wrap title + Suspense in `<Sections className="gap-5">`. Drop `mb-6`.
- **Footer** (`components/layout/footer/index.tsx`): wrap `FooterMenu` + copyright row in `<Sections className="gap-10">`. Retire the non-canonical `mb-15`.

`AGENTS.md` updates the Spacing subsection to drop the "partially rolled out" / "transitional state" sentence and replace it with: "This convention is rolled out across the template. New pages should use `<Sections>` from day one."

## Why it matters

- One spacing primitive across the whole storefront makes inter-section rhythm predictable.
- Removes the last `mb-15` (non-canonical) from the design system.
- Each `mb-*` baked into a child component (`AccountPageHeader`, cart `Header`, `CollectionTitle`, search title, footer menu) is now lifted to the parent composition, where it belongs — adding/removing siblings no longer requires editing the children.
- Skeleton geometry tracks the loaded page (cart `PageSkeleton` now wraps in its own Container + Sections), avoiding layout shift on Suspense resolve.

## Apply when

- Storefront still has any of: `mb-6` on `AccountPageHeader`, `mb-8 lg:mb-12` on cart `Header`, `mb-6` on `CollectionTitle`/`CollectionTitleSkeleton`, `mb-6` on the search-page title block, or `mb-15` on the footer menu.
- Storefront has not deliberately replaced page composition with a different design language.

## Safe to skip when

- Storefront has been re-skinned with intentionally different rhythm and you've already audited the change against your own design tokens.

## Notes

- The visual deltas are intentionally small: `mb-6` (24px) → `gap-5` (20px) on title-to-content on collection/search/account, `mb-15` (60px) → `gap-10` (40px) on the footer. If a designer flags one, the override is one line per page (`<Sections className="gap-X">`).
- `cart-items-list.tsx`'s `<ul className="space-y-5">` is intentionally NOT touched — list-internal item spacing isn't section rhythm. Skeleton internals (`SummarySkeleton`, `ItemsSkeleton`) similarly stay as-is.
- The about page is unchanged — Tailwind Typography plugin handles inter-paragraph spacing.

## Validation

1. `pnpm --filter template dev`.
2. `/cart` (with and without items): header → items/summary → related products rhythm reads cleanly. On mobile the items list and summary sidebar stack with a `gap-10`. Suspense fallback briefly visible during navigation has the same Container + Sections shape.
3. `/account/profile`, `/account/orders`, `/account/addresses`: header → content reads with a `gap-5` rhythm. No double-spacing, no collapsed spacing.
4. `/collections/[handle]`: title → toolbar → grid wall reads close to before (`mb-6` → `gap-5` is a 4px tighten). Skeleton geometry matches.
5. `/search?q=beds`: same.
6. Footer: menu grid → copyright row gap is `gap-10`. (Was `mb-15` ≈ 60px; now 40px — intentional tighten to canonical scale.)
7. DevTools: every migrated page has a `<div class="grid gap-N">` (Sections) at the top of its visible composition. No remaining `mb-*` / `mt-*` / `my-*` on direct children of those composers.
8. `pnpm --filter template lint` and `pnpm --filter template build` clean.
