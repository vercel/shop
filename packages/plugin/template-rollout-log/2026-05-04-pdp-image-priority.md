---
title: PDP image loading — split priority from eager and account for the color slot
changeKey: pdp-image-priority
introducedOn: 2026-05-04
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-media.tsx
---

## Summary

The PDP gallery's `priority` handling had two problems that hurt LCP and over-reserved preload bandwidth:

1. **Mobile carousel under-prioritized in color-partitioned mode.** The shared-items map used `priority={!children && idx === 0}`. Whenever a `mobileSlot` was passed (the resolved-color-images Suspense node), `children` was always truthy, so *no* shared item was marked priority — even if the resolved color images turned out to be empty. The mobile LCP candidate was lazy-loaded.
2. **Desktop grid double-prioritized.** `GridItem` used `priority={idx < 2}` independently for color images and shared items. With color partitioning on, the first two color images were priority *and* the first two shared items at visual positions 3/4 also got priority — four `<link rel=preload>` competing for a single PDP.

This change separates `priority` (the single LCP candidate — `fetchPriority="high"` plus a preload link) from `loading="eager"` (above-the-fold but not LCP — loads immediately without fighting the LCP for bandwidth), and computes both centrally in `ProductMedia` based on a `hasColorSlot` flag.

The rules are:

- **Color slot present** → `colorImage[0]` is `priority`, `colorImage[1]` is `eager`. The first shared item is `eager` to cover the case where color partitioning resolves to zero or one images and the shared item is therefore the second (or first) visible.
- **No color slot** → `shared[0]` is `priority`, `shared[1]` is `eager`.

`MediaImage` now accepts a separate `eager` prop so loading semantics aren't conflated with priority. `MediaVideo`'s preview image continues to use the combined `priority || eager` signal since the cost is small and the preview is what affects perceived load.

## Why it matters

- LCP: in color-partitioned mode with zero color images, the first shared image was lazy. Now it's eager (or priority where applicable).
- Bandwidth: only one image per PDP is now `priority`; the second visible is `eager` without a preload link. Browsers can prioritize correctly instead of seeing four equal-priority preloads.

## Apply when

- The storefront uses `ProductMedia`, `ColorImageGrid`, or `ColorImageCarouselItems` directly.

## Safe to skip when

- The storefront has replaced `ProductMedia` with a custom gallery that already routes priority through a single LCP candidate.

## Notes

- `MediaImage` now requires a `priority: boolean` and an `eager: boolean`. If you have callers outside `ProductMedia`, pass both explicitly.
- Videos still use the combined `priority || eager` signal for their preview image — the fix is image-focused.

## Validation

1. `pnpm --filter template lint` and `tsc --noEmit` clean.
2. `pnpm --filter template dev`. Open a PDP without color partitioning. In DevTools → Network, the first image is `fetchpriority=high` with a preload link in `<head>`, the second is `loading=eager` (no preload), the rest are lazy.
3. Open a PDP with color partitioning (a product with multiple colors that have their own images). Confirm the first color image is the only `priority` request, the second color image is `eager`, and the first shared image is `eager`. No second `<link rel=preload>` for product images.
4. Edge case: a color-partitioned product where the selected color resolves to no color images. Confirm the first shared image still loads quickly (`eager`).
