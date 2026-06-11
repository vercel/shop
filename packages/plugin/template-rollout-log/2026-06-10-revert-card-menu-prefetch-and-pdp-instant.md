---
title: Back out in-viewport content prefetch on cards/menu links and PDP instant validation
changeKey: revert-card-menu-prefetch-and-pdp-instant
introducedOn: 2026-06-10
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/components/nav/mobile-menu.tsx
  - apps/template/components/nav/quick-links.tsx
  - apps/template/components/footer/index.tsx
relatedSkills: []
---

## Summary

Reverts the `prefetch={true}` link tuning from `prefetch-product-cards-and-menu-links` and sets `export const instant = false` on the PDP (`app/products/[handle]/page.tsx`).

- Removed `prefetch={true}` from the two product-card links (`product-card.tsx`, `infinite-product-grid.tsx`) and the internal-URL branch of the three `MenuLink` wrappers (`nav/quick-links.tsx`, `nav/mobile-menu.tsx`, `footer/index.tsx`). Those `<Link>`s return to the global `prefetch: 'auto'` default, which under `partialPrefetching` carries only the per-route App Shell, not the destination's runtime content.
- Flipped the PDP from `instant = true` to `instant = false`. `instant` is the instant-navigation validation/insights toggle (dev-only) — `false` opts the PDP out of that validation and out of static-shell validation. It does not change prefetch or runtime rendering on its own.

The PDP keeps `prefetch = "allow-runtime"` (from `pdp-allow-runtime-prefetch`); that export is untouched.

## Why it matters

- Reduces runtime-prefetch traffic: a dense product grid no longer issues one full-content runtime prefetch per in-viewport card. Links prewarm only the shell again.
- Stops asserting instant navigation on the PDP, so the dev overlay no longer flags PDP navigations that block on cached/streamed content.

## Apply when

- A storefront adopted `prefetch-product-cards-and-menu-links` (`prefetch={true}` on cards/menu links) and wants to dial back prefetch volume, or
- The PDP `instant = true` validation is surfacing noise that the team does not intend to act on.

## Safe to skip when

- The storefront never adopted the `prefetch={true}` card/menu tuning (defaultAction there was `review`) and still runs PDP `instant = true` deliberately.
- The full-content prefetch on grids/nav is a measured win you want to keep — leave the links as-is.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` — the PDP, collections, search, and home routes still report Partial Prerender (◐).
2. `grep -rn 'prefetch={true}' apps/template/components` → no matches.
3. `grep -n 'export const instant' apps/template/app/products/[handle]/page.tsx` → `false`.

## See also

- `prefetch-product-cards-and-menu-links` (2026-06-10) — the `prefetch={true}` card/menu tuning this entry removes.
- `pdp-allow-runtime-prefetch` (2026-06-10) — added `prefetch = "allow-runtime"` to the PDP; still in effect, not reverted here.
- `next-canary-47-instant-prefetch-stable` (2026-06-09) — stabilized the `instant` / `prefetch` route segment config.
