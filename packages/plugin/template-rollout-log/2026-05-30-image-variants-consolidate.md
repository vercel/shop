---
title: Consolidate next/image variant matrix to two widths
changeKey: image-variants-consolidate
introducedOn: 2026-05-30
changeType: config
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/next.config.ts
---

## Summary

`apps/template/next.config.ts` drops from seven candidate widths (`deviceSizes: [640, 828, 1200, 1920]` + `imageSizes: [64, 128, 384]`) to two (`deviceSizes: [1080, 1920]`, `imageSizes: []`). Every Shopify image now resolves to one of two optimizer URLs per source — `?w=1080` or `?w=1920` — across PDPs, PLPs, the home banner, recommendations, cart thumbnails, search thumbnails, and lightbox.

## Why it matters

The previous matrix produced up to 14 cached objects per source image (7 widths × 2 formats), and the small `imageSizes` entries only had a handful of consumers (`cart/overlay-item.tsx`, `predictive-search-results.tsx`, `search-modal.tsx`, `color-picker.tsx`, `agent/registry.tsx`). Most surfaces use viewport-relative `sizes`, so cache hits across pages were rare — the PDP, PLP, recommendations row, and cart for the same product each hit a different URL.

Consolidating to two widths trades per-image bytes (small thumbnails now decode a 1080-wide source) for:

- Near-100% cross-surface cache hit rate after first product view
- ~4× smaller optimizer cache footprint
- Fewer cold-miss transforms (each new variant on first request runs the optimizer; the small entries were the most likely to be cold)
- Simpler mental model: one Shopify source → at most two cached assets

The tradeoff is real and concentrated on mobile PLP loads: a 20-card grid where each card used to fetch a `640` now fetches a `1080`, ~10KB extra per card, ~200KB extra per PLP visit on cellular. Downstream storefronts with heavy mobile-cellular traffic should evaluate against their own session economics before adopting.

## Apply when

- The storefront still uses the template's image configuration and has not customized `deviceSizes`/`imageSizes`.
- The storefront's traffic is predominantly broadband/fast-4G, or first-paint cache warmth matters more than per-thumbnail bandwidth.
- The storefront wants to reduce optimizer compute spend or LRU cache pressure on the Vercel image cache.

## Safe to skip when

- Mobile-cellular sessions dominate traffic and the ~200KB PLP bump is a measurable LCP/CLS regression.
- The storefront has already tuned its own variant matrix against analytics.
- The storefront serves a large, retina-dominant desktop audience and relies on the lightbox at near-pixel-perfect resolution (the cap at 1920 is unchanged from the previous config, so this is only a concern if you were already considering raising the ceiling).

## Validation

1. `pnpm --filter template dev`. Visit `/`, a PDP, a PLP, the cart overlay, and the lightbox. Confirm images render visibly the same.
2. DevTools → Network → filter `_next/image`. Confirm every optimized request is `&w=1080` or `&w=1920`. No `&w=640`, `&w=384`, `&w=128`, etc.
3. On a PLP, scroll and verify no images are visibly blurry on a retina mobile device (393×3 = ~1180 effective pixels, well within the 1080 → 1920 step).
4. Open the cart overlay with several items. Confirm thumbnails render; check decode time in Performance panel — should be ≤ ~20ms per thumbnail on a mid-tier mobile.
5. `pnpm --filter template lint` and `pnpm --filter template build` clean.
