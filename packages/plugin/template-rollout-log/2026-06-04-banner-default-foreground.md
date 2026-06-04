---
title: Banner default — no background, foreground text, primary CTA
changeKey: banner-default-foreground
introducedOn: 2026-06-04
changeType: enhancement
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/sections/banner-section.tsx
  - apps/template/public/hero.jpg
  - apps/docs/content/docs/anatomy/pages/home.mdx
---

## Summary

`BannerSection` no longer renders a dark `bg-foreground` container when neither `backgroundImage` nor `backgroundVideo` is provided. The default banner now has no background, uses `text-foreground` for the headline and subheadline, and lets the CTA fall back to the default (primary) `Button` variant.

When `backgroundImage` or `backgroundVideo` _is_ present, the banner still wraps the media in a `bg-foreground` container with the existing top-down gradient overlay, white headline/subheadline text, and a light `bg-background text-foreground` CTA — that path is unchanged.

The placeholder `apps/template/public/hero.jpg` asset is removed. The template home page never imported it (the homepage banner already shipped with no `backgroundImage`), so the deletion only drops dead weight from the public folder.

## Why it matters

- The previous default rendered a heavy black slab above the featured products grid even when no merchant media was provided, which read as "missing image" rather than a finished hero.
- Letting the default lean on theme tokens (`text-foreground`, primary button) means the banner adapts to whatever palette a storefront ships and stops fighting the rest of the page chrome.
- Storefronts that _want_ a dark media-backed hero still get the original styling automatically by passing `backgroundImage` or `backgroundVideo`.

## Apply when

- The storefront still uses `BannerSection` largely as shipped and has no `backgroundImage`/`backgroundVideo` wired into the home banner.
- The storefront wants the headline/subheadline/CTA to follow the theme's foreground and primary tokens instead of a fixed dark slab.

## Safe to skip when

- The storefront already passes a `backgroundImage` or `backgroundVideo` to every banner — the rendered output is unchanged in that case.
- The storefront has replaced the banner with a custom layout.

## Validation

1. `pnpm --filter template dev`.
2. Load `/` with the default `app/page.tsx` (no `backgroundImage`/`backgroundVideo`). Confirm the banner has no dark background, the headline and subheadline render in `text-foreground`, and the CTA uses the default primary button colors.
3. Pass a `backgroundImage` (static import or `{ url, alt }`) to the home banner and confirm the dark `bg-foreground` container, gradient overlay, white text, and `bg-background` CTA still render.
4. Pass a `backgroundVideo` and confirm the same media-on path renders against the video.
5. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit` clean.

## See also

- `banner-mobile-padding` (2026-05-02) — earlier banner adjustment that the new default builds on.
- `banner-video-media` (2026-05-02) — adds the shared `AutoPlayVideo`-backed video path that this entry keeps intact.
