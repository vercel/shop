---
title: Remove runtime-prefetch opt-ins (unstable_instant / unstable_prefetch)
changeKey: remove-runtime-prefetch-opt-ins
introducedOn: 2026-06-09
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/app/search/page.tsx
  - apps/template/app/collections/all/page.tsx
  - apps/template/app/collections/[handle]/page.tsx
relatedSkills:
  - /vercel-shop:enable-i18n
---

## Summary

Removes the route-level runtime-prefetch opt-ins from the PDP, search, and both collection routes:

- `unstable_instant = true` — PDP, search, collections (all + `[handle]`)
- `unstable_prefetch = "force-runtime"` — search, collections (all + `[handle]`)

`partialPrefetching: true` and `experimental.appShells` in `next.config.ts` are unchanged, so `<Link>` still prefetches each route's static shell. What goes away is the per-link runtime server request that warmed dynamic (session/cookie-dependent) content ahead of navigation.

## Why it matters

- `force-runtime` / `unstable_instant` issue a runtime server request per prefetched link. On dense link surfaces (product grids), that multiplies prefetch traffic.
- Without them, navigation still paints the static shell instantly, but dynamic holes stream in after navigation (Suspense fallbacks reappear briefly) instead of being pre-warmed.
- This is the trade-off downstream stores should make consciously: fewer prefetch server requests vs. zero-fallback navigation on dynamic routes.

## Apply when

- Prefetch/runtime cost from runtime prefetching outweighs the perceived-instant benefit.
- The store's PDP/collection/search content is mostly cacheable, so the static shell already covers the visible area.

## Safe to skip when

- The store deliberately wants fallback-free navigation on these dynamic routes and accepts the per-link runtime prefetch cost.

## Validation

1. `pnpm --filter template build && pnpm --filter template start` (automatic prefetch is production-only).
2. Navigate to PDP / collection / search from in-viewport links; confirm the static shell paints instantly and dynamic content streams in.
3. `pnpm --filter template lint` clean.

## See also

- `next-canary-12-instant-validation-default` (2026-05-06) — introduced the `unstable_instant` default this entry removes.
- `skeleton-fallback-color` (2026-06-09) — skeleton/fallback appearance, more visible now that dynamic holes stream again.
