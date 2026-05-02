---
title: Banner video media and shared autoplay video
changeKey: banner-video-media
introducedOn: 2026-05-02
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/ui/auto-play-video.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/components/product-detail/lightbox.tsx
  - apps/template/components/sections/banner-section.tsx
  - apps/template/lib/types.ts
  - apps/docs/content/docs/anatomy/pages/home.mdx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

`AutoPlayVideo` moves from the product-detail folder into `components/ui` so product media, lightbox media, and future shared surfaces can use the same autoplay behavior.

`BannerSection` now accepts `backgroundVideo` in addition to `backgroundImage`. When present, the video renders behind the existing gradient and text overlay; otherwise the banner falls back to the existing image behavior.

## Why it matters

Hero videos are a common storefront request, and the autoplay behavior was already implemented for PDP media. Sharing it from `components/ui` avoids duplicating visibility-based play/pause logic.

## Apply when

- The storefront uses `components/product-detail/auto-play-video.tsx` directly or copied the product media implementation.
- The storefront uses `BannerSection` or wants a video-backed home hero.

## Safe to skip when

- The storefront already has a custom video component with equivalent visibility-based autoplay behavior.
- The storefront has replaced the home banner with a custom media implementation.

## Notes

- `components/ui/auto-play-video.tsx` accepts primitive preview image props and does not import domain types.
- `backgroundVideo` wins over `backgroundImage` when both are present.

## Validation

1. `pnpm --filter template dev`.
2. Open a PDP with video media and confirm videos autoplay in the gallery and lightbox.
3. Pass `backgroundVideo` to the home banner and confirm it renders object-cover behind the existing gradient/text overlay.
4. Remove `backgroundVideo` and confirm the default image banner still renders.
5. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit` clean.
