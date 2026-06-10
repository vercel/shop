---
title: Product cards and menu links — opt into full content prefetch (prefetch={true})
changeKey: prefetch-product-cards-and-menu-links
introducedOn: 2026-06-10
changeType: enhancement
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

Add `prefetch={true}` to the `<Link>` in the two product-card components and the three menu-link wrappers:

- `product-card/product-card.tsx` — the server `ProductCard` wrapping link to `/products/[handle]`.
- `collections/infinite-product-grid.tsx` — the `ClientProductCard` link used in the infinite-scroll collection grid.
- `nav/quick-links.tsx`, `nav/mobile-menu.tsx`, `footer/index.tsx` — the internal-URL branch of each `MenuLink` wrapper (the external `http` branch still renders a plain `<a>` and is untouched).

With `partialPrefetching: true` on globally (`next.config.ts`), `<Link>` defaults to `prefetch: 'auto'`, which under partial prefetching carries only the per-route App Shell — not the page content. Product-card links target the PDP and menu links target collections, both of which export `prefetch = "allow-runtime"`. `prefetch={true}` opts those in-viewport links into prefetching the destination's runtime content, so the cached product/collection body and resolved metadata arrive before the click instead of after a post-click round-trip.

## Why it matters

- This is the `<Link prefetch>` tuning the `pdp-allow-runtime-prefetch` entry pointed at: `allow-runtime` lets a route *serve* a runtime prefetch, but the link still has to *request* full content. `prefetch={true}` is that request.
- The destination renders (`getProduct` / collection fetch) are `"use cache"` / `cacheLife("max")`, so each runtime prefetch is a cheap cache hit, and client navigations from grids and nav land on real content + correct title instantly.

## Apply when

- The storefront is on `next@16.3.0-canary.47`+ with `partialPrefetching: true`, and the PDP/collection routes still export `prefetch = "allow-runtime"` (see `pdp-allow-runtime-prefetch`).
- The product cards and Shopify-menu-driven nav are largely as shipped.

## Safe to skip when

- The storefront wants to minimize runtime-prefetch volume. A dense grid puts many product-card links in the viewport at once; `prefetch={true}` issues one runtime prefetch each. They are cache hits, but it is more prefetch traffic than the `auto` shell-only default. Leave the default (or set `prefetch={false}`) on the highest-fanout grid if prefetch volume is a concern.
- A menu link points at a route that is not worth prewarming (rarely visited, or uncacheable).

## Notes

- `prefetch` only affects the internal `<Link>` branch of each `MenuLink`; external links are plain anchors and cannot be prefetched.
- Prefetching is production-only — there is no prefetch traffic in `pnpm dev`. Validate the behavioral win against a production build.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build`.
2. `pnpm --filter template start` (production), then hover/scroll a product grid and the nav menus: the destination prefetches (visible as prefetch requests in the Network panel), and clicking a product card or menu item lands on real content with the correct title, no skeleton flash.
3. `grep -rn 'prefetch' apps/template/components/{product-card,collections,nav,footer}` → the five links carry `prefetch={true}`.

## See also

- `pdp-allow-runtime-prefetch` (2026-06-10) — added `prefetch = "allow-runtime"` to the PDP and called out `<Link prefetch>` as the per-link tuning knob this change applies.
- `next-canary-47-instant-prefetch-stable` (2026-06-09) — stabilized the `instant` / `prefetch` route segment config and added `allow-runtime` to collections/search.
