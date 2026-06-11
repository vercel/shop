---
title: Remove prefetch={true} from product cards and menu links
changeKey: remove-card-menu-prefetch
introducedOn: 2026-06-11
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/components/nav/mobile-menu.tsx
  - apps/template/components/nav/quick-links.tsx
  - apps/template/components/footer/index.tsx
relatedSkills: []
---

## Summary

Removes the `prefetch={true}` link tuning from `prefetch-product-cards-and-menu-links` (#331) on the two product-card links and the three `MenuLink` wrappers, returning them to the global `prefetch: 'auto'` default.

- Dropped `prefetch={true}` from `product-card/product-card.tsx` and `collections/infinite-product-grid.tsx` (the two product-card links to `/products/[handle]`).
- Dropped `prefetch={true}` from the internal-URL branch of the three `MenuLink` wrappers (`nav/quick-links.tsx`, `nav/mobile-menu.tsx`, `footer/index.tsx`). The external `http` branch still renders a plain `<a>` and was already untouched.

Under `partialPrefetching: true` (`next.config.ts`), `prefetch: 'auto'` carries only the per-route App Shell, not the destination's runtime content. The PDP keeps `prefetch = "allow-runtime"` and `instant = true` — both untouched.

This isolates only the link-level prefetch reversal. The companion `revert-card-menu-prefetch-and-pdp-instant` entry does the same removal **and** flips the PDP to `instant = false`; this change leaves `instant` alone.

## Why it matters

- Reduces runtime-prefetch traffic: a dense product grid no longer issues one full-content runtime prefetch per in-viewport card. Links prewarm only the shell again.

## Apply when

- A storefront adopted `prefetch-product-cards-and-menu-links` and wants to dial back prefetch volume, but wants to keep the PDP `instant = true` validation in place.

## Safe to skip when

- The storefront never adopted the `prefetch={true}` card/menu tuning.
- The full-content prefetch on grids/nav is a measured win you want to keep — leave the links as-is.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build`.
2. `grep -rn 'prefetch={true}' apps/template/components` → no matches.

## See also

- `prefetch-product-cards-and-menu-links` (2026-06-10) — the `prefetch={true}` card/menu tuning this entry removes.
- `revert-card-menu-prefetch-and-pdp-instant` (2026-06-10) — same link removal plus PDP `instant = false`; this entry is the link-only subset.
- `pdp-allow-runtime-prefetch` (2026-06-10) — added `prefetch = "allow-runtime"` to the PDP; still in effect, not reverted here.
