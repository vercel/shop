---
title: Product cards and menu links — drop forced full-content prefetch (prefetch={true})
changeKey: drop-link-prefetch-true
introducedOn: 2026-06-21
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

Remove the `prefetch={true}` prop from the `<Link>` in the two product-card components and the three menu-link wrappers, reverting them to the default `prefetch: 'auto'`:

- `product-card/product-card.tsx` — the server `ProductCard` wrapping link to `/products/[handle]`.
- `collections/infinite-product-grid.tsx` — the `ClientProductCard` link used in the infinite-scroll collection grid.
- `nav/quick-links.tsx`, `nav/mobile-menu.tsx`, `footer/index.tsx` — the internal-URL branch of each `MenuLink` wrapper (the external `http` branch is a plain `<a>` and was never affected).

This backs out `prefetch-product-cards-and-menu-links` (2026-06-10). No config or type changes are involved — only the five `prefetch={true}` attributes are deleted.

## Why it matters

- With `partialPrefetching: true` on globally (`next.config.ts`), the default `prefetch: 'auto'` carries only the per-route App Shell into in-viewport links instead of the destination's full runtime content. On link-dense pages (product grids, nav menus) that is far less background prefetch traffic.
- `prefetch={true}` issued one runtime prefetch per in-viewport link. Each was a cheap `cacheLife("max")` cache hit, but a dense grid could fan out dozens of them on scroll. Dropping the prop trades the instant full-content landing for the cheaper shell-only default; the runtime content fills in on a post-click round-trip.
- The PDP and collection routes still export `prefetch = "allow-runtime"`, so they remain *able* to serve a runtime prefetch — this change only stops the links from *requesting* full content eagerly.

## Apply when

- The storefront wants to minimize runtime-prefetch volume on high-fanout product grids and Shopify-menu-driven nav.
- The product cards and menu wrappers are largely as shipped (still carry `prefetch={true}` from the earlier rollout).

## Safe to skip when

- The storefront deliberately opted into eager full-content prefetch for instant client navigations and is comfortable with the extra prefetch traffic.
- You instead prefer the on-intent middle ground (`unstable_dynamicOnHover`): cheap shell prefetch in viewport, full dynamic prefetch on hover/touch. That requires augmenting `LinkProps` in `global.ts` and enabling `experimental.dynamicOnHover` in `next.config.ts`.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build`.
2. `grep -rn 'prefetch=' apps/template/components/{product-card,collections,nav,footer}` → no matches.
3. `pnpm --filter template start` (production): scrolling a product grid no longer fires one runtime prefetch per in-viewport card in the Network panel; clicking still navigates correctly (now via a post-click round-trip for the runtime content).

## See also

- `prefetch-product-cards-and-menu-links` (2026-06-10) — added the `prefetch={true}` this entry removes.
- `pdp-allow-runtime-prefetch` (2026-06-10) — the PDP `prefetch = "allow-runtime"` route config, which stays in place.
