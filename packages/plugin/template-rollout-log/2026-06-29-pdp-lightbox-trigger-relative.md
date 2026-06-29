---
title: PDP lightbox trigger — make the button a positioning context for its fill image
changeKey: pdp-lightbox-trigger-relative
introducedOn: 2026-06-29
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/lightbox.tsx
---

## Summary

`LightboxTrigger` wraps a `fill` `next/image` in a `<button>` but the button lacked `relative`. Added `relative` to its className (`relative h-full w-full cursor-zoom-in`).

## Why it matters

A `fill` image is `position: absolute` and resolves against its nearest positioned ancestor. Without `relative` on the button, the image (and any absolutely-positioned affordance a downstream adds inside the trigger — e.g. a zoom icon) positions against an outer ancestor instead of the button itself. In the shipped template the grid cell happens to be `relative` and the same size as the button, so the image still fills correctly — but the button is the element that *should* own that context. This makes the trigger self-contained so a zoom badge or overlay can be dropped in without breaking on fill-image layouts.

## Apply when

- The storefront still uses `components/product-detail/lightbox.tsx` with `LightboxTrigger` wrapping a `fill` image.

## Safe to skip when

- The trigger has been replaced, or already wraps a non-fill (intrinsic-size) image in its own positioned container.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit`.
2. On a desktop PDP, the gallery images still fill their grid cells and open the lightbox on click; an absolutely-positioned child of the trigger now anchors to the image bounds.
