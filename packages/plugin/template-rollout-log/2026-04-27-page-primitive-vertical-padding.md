---
title: Page primitive — hoist page-level top padding off Container
changeKey: page-primitive-vertical-padding
introducedOn: 2026-04-27
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
  - apps/template/app/about/page.tsx
  - apps/template/app/account/(authenticated)/layout.tsx
  - apps/template/app/cart/page.tsx
  - apps/template/app/not-found.tsx
  - apps/template/app/page.tsx
  - apps/template/app/search/page.tsx
  - apps/template/components/cart-page/skeletons.tsx
  - apps/template/components/collections/collection-page.tsx
  - apps/template/components/product-detail/product-detail-page.tsx
  - apps/template/components/ui/page.tsx
---

## Summary

Adds a new `<Page>` primitive (`components/ui/page.tsx`) that owns page-level top padding. Migrates every storefront page off the previous `<Container className="py-10">` pattern.

- `Container` keeps its single responsibility: horizontal padding + max-width.
- `Page` is a plain `<div>` whose only baked-in class is `pt-10`. No bottom padding — the gap above the footer comes from the footer's own `pt-10`. (Net result: the bottom whitespace shrinks from ~80px to ~40px vs. the previous `py-10` on each page.)
- Overrides go through `className` like any other Tailwind primitive — `<Page className="pt-0">` for pages that want their first child flush to the nav, or `<Page className="pt-2.5 md:pt-10">` to tighten the mobile top on search/collection. twMerge from `cn()` correctly resolves overrides against the default.
- `Page` doesn't set `flex` by default. Layouts that need to fill viewport height (account layout, `not-found`) add `flex flex-1 flex-col` via `className`.

Per-area changes:

- **Home** (`app/page.tsx`): `<Sections className="pb-10">` → `<Page className="pt-0"><Sections>…</Sections></Page>`. Hero stays flush to the nav. Bottom gap to footer is now footer's `pt-10` only.
- **Search** (`app/search/page.tsx`): `<Container className="pt-2.5 md:pt-10 pb-10">` → `<Page className="pt-2.5 md:pt-10"><Container>…</Container></Page>`.
- **Collection** (`components/collections/collection-page.tsx`): same shape as search.
- **Cart** (`app/cart/page.tsx`, `components/cart-page/skeletons.tsx`): `<Container className="py-10"><Sections>…` → `<Page><Container><Sections>…`. The `PageSkeleton` Suspense fallback gets the same shape so geometry tracks the loaded page.
- **About** (`app/about/page.tsx`): `<Container className="max-w-2xl py-10">` → `<Page><Container className="max-w-2xl">…</Container></Page>`.
- **Account layout** (`app/account/(authenticated)/layout.tsx`): `<Container className="py-10 flex flex-1 flex-col …">` → `<Page className="flex flex-1 flex-col"><Container className="flex flex-1 flex-col …">…</Container></Page>`. `Page` must be flex-col flex-1 here so the inner Container's flex-1 propagates from `<main>` through the padding wrapper.
- **PDP** (`components/product-detail/product-detail-page.tsx`): `<Container className="bg-background pt-0 pb-10">` → `<Page className="pt-0"><Container className="bg-background">…</Container></Page>`. Carousel stays flush to the nav. `bg-background` stays on `Container` so the background remains contained, not full-bleed.
- **Not-found** (`app/not-found.tsx`): `<Container className="… py-10 lg:py-10">` (the `lg:py-10` was redundant) → `<Page className="flex flex-1 flex-col"><Container className="flex flex-1 flex-col items-center justify-center text-center">…</Container></Page>`.

`AGENTS.md`'s Spacing section now leads with `Page` and the canonical override examples; the existing `Sections` guidance is preserved unchanged below it.

## Why it matters

- One primitive owns the page-level top padding token instead of the same `pt-10` (or `py-10`) being repeated on every page's `<Container>`. Adjusting global page rhythm is now a single edit in `Page`.
- Override surface stays Tailwind-native — no special prop API to learn. `<Page className="pt-0">` reads exactly like any other utility-class override.
- `Container` no longer drifts into multi-purpose. Anyone adding a new page sees `<Page><Container>` and can't put `py-*` on `Container` without lint signaling intent ambiguity in review.
- Skeleton fallbacks for cart now share the same `Page + Container + Sections` shape as the loaded page, matching the broader skeleton-geometry convention from the earlier `sections-rollout-complete` change.

## Apply when

- Storefront still has `<Container className="py-10">` (or `py-10 …` with other classes) on any page or layout.
- Storefront still has `<Container className="pt-2.5 md:pt-10 pb-10">` on `/search` or `/collections/[handle]`.
- Storefront still has `pt-0 pb-10` on PDP's outer `<Container>`.

## Safe to skip when

- Storefront has been re-skinned with intentionally different page rhythm (e.g. `py-16` on desktop, or visible bottom whitespace on every page) and you've consciously chosen not to centralize that token.
- Storefront has replaced `<Container>` with a different layout primitive entirely.

## Notes

- twMerge from `cn()` correctly resolves `pt-10` (default) against an override like `pt-0` or `pt-2.5 md:pt-10`. Verify by reading the rendered DOM in DevTools, not by reading the className string.
- Bottom whitespace before the footer is now ~40px (footer's own `pt-10`) on every page. Prior pages had ~80px (`pb-10` on the page + footer's `pt-10`). If a downstream storefront wants the larger gap back, pass `<Page className="pb-10">` on every page or update the footer.
- Pages that need to fill viewport height (sidebar layouts, centered error states) need `flex flex-1 flex-col` on `Page`, otherwise the inner `flex-1` won't propagate from `<main>`. Two adjacent flex-cols (Page → Container) is fine.
- The about page's prose layout is unchanged; `<Container className="max-w-2xl">` still works inside `<Page>`.

## Validation

1. `pnpm --filter template dev`.
2. `/` (home): hero is flush to the nav. Featured products grid sits ~40px above the footer (footer's `pt-10` only).
3. `/search`, `/collections/[handle]`: title sits 10px from the nav on mobile, 40px from the nav at `md` and up. ~40px below the grid before the footer.
4. `/cart` (with items): 40px above the header. ~40px below related products before the footer. Suspense fallback briefly visible during navigation has the same `Page + Container + Sections` shape.
5. `/cart` (empty): unchanged — `Empty` component still owns its own centered layout.
6. `/products/[handle]` (PDP): carousel is flush to the nav. `bg-background` stays contained.
7. `/about`: 40px above the prose article. ~40px below before the footer.
8. `/account/profile`, `/account/orders`, `/account/addresses`: sidebar fills the height between nav + footer; 40px above the content area.
9. `/foo` (not-found): centered notFound message vertically fills the area between nav and footer.
10. DevTools: every migrated page has a `<div class="pt-10 …">` (or `pt-0`) wrapping the `<Container>`. No `py-*` on `<Container>` itself anywhere. No `pb-10` on `<Page>` anywhere by default.
11. `pnpm --filter template lint` and `pnpm --filter template build` clean.
