---
title: Banner mobile padding and optional image dimensions
changeKey: banner-mobile-padding
introducedOn: 2026-05-02
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/sections/banner-section.tsx
  - apps/template/lib/types.ts
  - apps/docs/content/docs/anatomy/pages/home.mdx
---

## Summary

The home banner no longer uses a strict mobile aspect ratio. Mobile height now comes from the banner content area using `py-10`, while medium screens and up keep the wide `3 / 1` aspect ratio.

Remote banner background images also no longer require `width` and `height` on the `MarketingImage` object. A remote hero can now pass only `url` and `alt`.

## Why it matters

Mobile banners need more breathing room for real merchant copy than a fixed image ratio provides, and background images rendered with `fill` do not need caller-provided dimensions.

## Apply when

- The storefront uses `BannerSection` or a copied version of the home hero.
- The storefront passes remote `backgroundImage` objects and wants to stop plumbing unused dimensions.

## Safe to skip when

- The storefront already replaced the banner with a custom layout.
- The storefront intentionally depends on a fixed mobile image aspect ratio.

## Validation

1. `pnpm --filter template dev`.
2. Open the home page at mobile width and confirm the hero height is driven by content padding instead of a forced image ratio.
3. Open the home page at medium and desktop widths and confirm the banner keeps the wide hero presentation.
4. Pass a remote `backgroundImage` with only `url` and `alt` and confirm type checking passes.
5. `pnpm --filter template lint` and `tsc --noEmit` clean.
