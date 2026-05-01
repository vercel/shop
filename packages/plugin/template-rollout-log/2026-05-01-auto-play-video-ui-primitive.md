---
title: AutoPlayVideo — promote to ui/ primitive, fix cold-load race
changeKey: auto-play-video-ui-primitive
introducedOn: 2026-05-01
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/ui/auto-play-video.tsx
  - apps/template/components/product-detail/lightbox.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

Two changes to the autoplay video helper:

1. **Move from `components/product-detail/` to `components/ui/`.** The component is a generic primitive (a `<video>` that auto-plays when in view, with an image poster underneath until `canplay`). Keeping it under `product-detail/` was incidental — it was first added there. Moving it to `ui/` matches the convention that `components/ui/` is for components that don't import domain types and don't translate. The previous `import type { Image as ImageType } from "@/lib/types"` is replaced with a locally exported `AutoPlayVideoPreviewImage` interface (structurally compatible with the lib `Image` shape, so existing call sites pass through unchanged).

2. **Fix cold-load race in autoplay.** The IntersectionObserver was the only autoplay trigger. On a cold cache the observer's initial callback can fire before the video's metadata loads — `play()` at `readyState=0` races the load and silently rejects on Safari and slow Chrome. Since the observer only re-fires on intersection transitions, a failed initial play would never retry, leaving the poster stuck. A `canplay` listener inside the same effect now retries `play()` when the element is currently visible, pairing with the observer rather than replacing it.

Imports in `components/product-detail/lightbox.tsx` and `components/product-detail/product-media.tsx` are updated to the new path. The PDP anatomy doc's key-files table is updated to point at the new path.

## Why it matters

- The cold-load race shows up as "the hero/PDP video sometimes never starts on first load." It's not deterministic, so it's been easy to miss in dev where the video is usually warm. The fix is a single small effect addition.
- Promoting AutoPlayVideo to `ui/` makes it reusable from non-product surfaces (banners, marketing sections, custom media tiles) without forcing those surfaces to import from `components/product-detail/`. Sets up the `BannerSection` video pattern cleanly for downstream forks.
- The rule "components in `ui/` must not import domain types" is documented in `apps/template/AGENTS.md`. AutoPlayVideo previously violated it; the move + the locally exported preview-image interface bring it into compliance.

## Apply when

- The storefront uses `AutoPlayVideo` directly, or imports from `components/product-detail/auto-play-video`.
- Or the storefront has noticed videos occasionally not autoplaying on first load.

## Safe to skip when

- The storefront has already replaced `AutoPlayVideo` with its own video primitive.
- The storefront only ever serves warm-cached videos on first paint and has not seen the autoplay regression.

## Notes

- The new path is `@/components/ui/auto-play-video`. The old path `@/components/product-detail/auto-play-video` is deleted.
- `AutoPlayVideoPreviewImage` is exported from the new module. The lib `Image` shape (from `lib/types`) is structurally assignable, so existing call sites do not need to change their data shape.
- The cold-load fix is independent of the move — a downstream fork that wants only the bug fix can patch the existing file in place.

## Validation

1. `pnpm --filter template dev`.
2. PDP with a video media item: confirm the gallery video autoplays after a hard refresh (no cache). Repeat in Safari if available.
3. Hover the desktop gallery thumbnails or swipe the mobile carousel — the video should pause when out of view and resume when it returns.
4. `tsc --noEmit` and `pnpm --filter template lint` both clean.
