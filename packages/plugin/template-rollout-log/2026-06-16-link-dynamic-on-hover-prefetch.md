---
title: Replace eager full Link prefetch with hover-upgraded dynamic prefetch (unstable_dynamicOnHover)
changeKey: link-dynamic-on-hover-prefetch
introducedOn: 2026-06-16
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/next.config.ts
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/components/footer/index.tsx
  - apps/template/components/nav/mobile-menu.tsx
  - apps/template/components/nav/quick-links.tsx
  - apps/template/components/product-card/product-card.tsx
---

## Summary

Every internal `<Link>` that previously set `prefetch={true}` (footer links, quick links, mobile menu, product cards, and the infinite product grid) now sets `unstable_dynamicOnHover` instead, and `next.config.ts` enables `experimental.dynamicOnHover: true`.

`prefetch={true}` does a **full** prefetch (route + dynamic data) as soon as the link enters the viewport. On link-dense pages — PLP grids especially — that fans out into a large number of eager background requests, which Next.js 16 made more aggressive by default.

`unstable_dynamicOnHover` keeps the cheap default viewport prefetch (the partial shell down to the nearest `loading` boundary, `FetchStrategy.PPR`) and **upgrades that link to a full dynamic prefetch only on hover/touchstart** (`FetchStrategy.Full`). The prop is gated behind the `experimental.dynamicOnHover` flag (exposed to the client as `process.env.__NEXT_DYNAMIC_ON_HOVER`); without the flag the prop is inert. Both are required.

Verified against `next@16.3.0-canary.48`: prop typed at `node_modules/next/dist/client/app-dir/link.d.ts` (`unstable_dynamicOnHover?: boolean`); gate at `client/components/links.js` (`onNavigationIntent`); flag default `false` in `server/config-shared.js`. Landed upstream in vercel/next.js#77866.

## Why it matters

Cuts background data transfer on link-heavy pages without losing perceived navigation speed: the full payload is still warmed on hover/touch intent, before the click. This is the framework-native equivalent of the documented `HoverPrefetchLink` (`prefetch={active ? null : false}` toggled on `onMouseEnter`) recipe, without the per-link `useState` wrapper.

## Apply when

- You are on a Next.js version that ships the prop **and** the `experimental.dynamicOnHover` flag (16.3 canary line or later that retains it), and your storefront has link-dense surfaces (PLP grids, mega-nav, footer) where eager full prefetch is wasteful.

## Safe to skip when

- You are pinned to a Next.js version without the flag/prop — the prop is inert (or a type error) without `experimental.dynamicOnHover`. Because the API is `unstable_`, it can change or be removed between canaries; treat adoption as a conscious, revisitable choice rather than a default.
- A given link must have its full payload ready even when the user navigates without hovering (e.g. keyboard-only or programmatic navigation). For those, keep `prefetch={true}`.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build`.
2. Build and run in production mode (`pnpm --filter template build && pnpm --filter template start`) — prefetch is production-only, so dev will not exercise it.
3. With the Network panel open on a PLP, confirm links in the viewport issue a partial (not full) prefetch on load, and that hovering a product card issues the full route/data prefetch before click.
4. Remove `experimental.dynamicOnHover` and confirm the prop goes inert (no hover-triggered full prefetch) — verifies the flag gate, not just the prop.
