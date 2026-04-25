---
title: Unify nav on the Shopify menu schema and add inline hover panel
changeKey: unify-nav-shopify-menu
introducedOn: 2026-04-25
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/layout/nav/index.tsx
  - apps/template/components/layout/nav/quick-links.tsx
  - apps/template/components/layout/nav/mobile-menu.tsx
  - apps/template/components/layout/nav/menu-data.ts
---

## Summary

The nav layer previously carried three different mental models for "a menu":

1. Hardcoded `[{ label, href }]` arrays duplicated in `quick-links.tsx` and `mobile-menu.tsx` — flat, two fields, manually kept in sync.
2. Shopify `Menu`/`MenuItem` (`lib/shopify/types/menu.ts`) — recursive, fetched via `getMenu(handle, locale)`, but unused.
3. Bespoke `Megamenu*` types and a separate "Browse" hamburger, scaffolded only when the `enable-shopify-menus` skill (Part C) ran.

The default nav now consumes a single shape — the Shopify `MenuItem` — and renders a hover-driven inline mega panel without any extra trigger button:

- `quick-links.tsx` and `mobile-menu.tsx` accept `items: MenuItem[]`.
- A new `menu-data.ts` exports a hardcoded `defaultNavItems: MenuItem[]` (Shop, About) so fresh clones still work without Shopify creds. Swapping in `getMenu("main-menu", locale)` is a one-line change in `nav/index.tsx`.
- Top-level items with no children render exactly as before.
- Top-level items with children render a `ChevronDown` next to the link. On hover or keyboard focus, a full-width panel drops below the nav: `bg-background border-b shadow-md` with a 5-column `grid` (capped at 5 level-2 children). Each column has the level-2 title as a header link and the level-3 items as a list beneath. Driven entirely by `group-hover` + `group-focus-within` — no client component.
- The mobile menu uses the existing `Accordion` (`components/ui/accordion.tsx`). Items with children become accordion triggers; items without remain plain links. The expanded content includes a "Show all {category}" link (using the existing `nav.showAllCategory` key) so the parent URL is still reachable.

## Why it matters

- One data shape across desktop, mobile, server fetches, and downstream replacements. No parallel `Megamenu*` types, no bespoke transform.
- The default nav now handles arbitrary menu depth without changing components, so storefronts that wire `getMenu("main-menu", locale)` get a working inline mega menu with zero additional code.
- Removes the conceptual split between "simple menu" and "mega menu" — they're the same data, just rendered with or without the hover panel.

## Apply when

- The storefront still uses the original `[{ label, href }]` arrays in `quick-links.tsx` / `mobile-menu.tsx`.
- The storefront has not already customized its nav into a different structure.

## Safe to skip when

- The storefront has replaced the default nav with a fully custom build.
- The storefront ran `enable-shopify-menus` Part C and is happy with the standalone Browse-button megamenu — though see the follow-up note below; that path is now redundant.

## Validation

1. `pnpm dev` in `apps/template`. Visit `/`. Confirm "Shop" and "About" still render, no caret, no panel — current behavior preserved.
2. Edit `menu-data.ts` to give "Shop" two `MenuItem` children, each with two grandchildren. Reload.
   - Caret appears next to "Shop"; "About" unchanged.
   - Hover "Shop" → full-width panel drops down with one column per level-2 child (header + nested list each).
   - Tab to "Shop" → panel opens via focus-within. Tab into panel links works. Tab past last link closes panel.
3. Open the mobile Sheet. Confirm "Shop" is now an accordion trigger; expanding shows nested children plus a "Show all Shop" link. "About" stays a plain link.
4. Add a 6th level-2 child — confirm only the first 5 render (cap respected).
5. No console errors, no hydration warnings.

## Follow-ups

- `packages/plugin/skills/enable-shopify-menus/SKILL.md` — Part C (separate Browse-button megamenu, `MegamenuItem`/`Panel`/`Category` types, `lib/shopify/operations/megamenu.ts`) is now redundant. Future revision should delete Part C and simplify Part A to "swap the import in `menu-data.ts`".
- Storefronts wanting Shopify-fed nav can replace `defaultNavItems` in `nav/index.tsx` with `await getMenu("main-menu", locale)` and a fallback to `defaultNavItems` if `getMenu` returns `null`. The existing cache infrastructure (`"use cache: remote"`, `cacheTag("menus")`, `cacheLife("max")`) handles this end to end.
