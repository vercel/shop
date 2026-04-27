---
title: Flatten components/layout into top-level component folders; move default menu items into lib/config.ts
changeKey: flatten-layout-and-config-menu-data
introducedOn: 2026-04-26
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/nav/
  - apps/template/components/footer/
  - apps/template/components/action-bar/
  - apps/template/lib/config.ts
  - apps/template/app/layout.tsx
---

## Summary

Two related cleanups:

1. **Drop the `components/layout/` wrapper.** `components/layout/{nav,footer,action-bar}/` → `components/{nav,footer,action-bar}/`. Each sub-folder still holds its own internal files (e.g. `nav/` keeps its 8 files), but the `layout/` parent only ever held those three folders and added one needless level. Importers updated:
   - `app/layout.tsx`: `@/components/layout/{nav,footer,action-bar}` → `@/components/{nav,footer,action-bar}`.
   - `apps/template/AGENTS.md`: nav account file path reference.

2. **Move default nav/footer items into `lib/config.ts` as standalone exports.** The two `menu-data.ts` files inside `components/nav/` and `components/footer/` were just declarative defaults — the same shape downstream sites or `enable-shopify-menus` would override. They're now exported alongside `siteConfig` from `lib/config.ts` as `navItems: MenuItem[]` and `footerItems: MenuItem[]` (the latter empty by default). They are not folded into `siteConfig` — they live as plain top-level exports, the way `enable-shopify-menus` is expected to swap them out. The `menu-data.ts` files are deleted.

No behavior changes. No public API changes.

## Why it matters

- One less directory level to navigate and import through.
- "What links does my site show?" is now answered in one place (`lib/config.ts`) next to `siteConfig`, instead of two random `menu-data.ts` files buried in component folders.
- Keeping `navItems` / `footerItems` as plain exports (rather than `siteConfig.navItems`) keeps the swap point ergonomic: skills like `enable-shopify-menus` can replace one named export with a server fetch without rewriting `siteConfig` shape.

## Apply when

- The storefront still uses the shipped layout component locations and imports them at the listed paths.
- The storefront has not introduced its own `components/layout/...` files that would conflict with a flatten.

## Safe to skip when

- The storefront has already restructured `components/layout/` (e.g. into a different organizational scheme) — adopt only the menu-data → `lib/config.ts` portion in that case.
- The storefront fetches nav/footer items from Shopify via `enable-shopify-menus` and has already replaced `defaultNavItems` / `defaultFooterItems`. In that case `navItems` / `footerItems` may serve only as a fallback, or be removed entirely.

## Migration

1. `git mv apps/template/components/layout/nav apps/template/components/nav` (and the same for `footer`, `action-bar`). Remove the empty `components/layout/` directory.
2. Move the `defaultNavItems` and `defaultFooterItems` arrays from `components/{nav,footer}/menu-data.ts` into `lib/config.ts` as top-level `navItems` and `footerItems` exports (alongside `siteConfig`, not inside it). Delete the two `menu-data.ts` files.
3. Update `components/nav/index.tsx` and `components/footer/index.tsx` to import `navItems` / `footerItems` from `@/lib/config` instead of `./menu-data`.
4. Update `app/layout.tsx` imports: `@/components/layout/...` → `@/components/...`.
5. Run `pnpm format` so the `app/layout.tsx` import block reorders.

## Validation

1. `pnpm lint` — clean (pre-existing warnings about effect dep arrays are unrelated).
2. `pnpm dev` and load `/` — top nav renders the brand link plus the `Shop` and `About` items, footer renders the copyright. Mobile menu and search modal still open.
3. `git grep "components/layout"` returns no results in `apps/template/` or `apps/docs/`.
