---
title: Rename ScrollCarousel → Slider, drop py-5 from outer wrapper
changeKey: rename-scroll-carousel-to-slider
introducedOn: 2026-04-27
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/docs/content/docs/anatomy/pages/home.mdx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
  - apps/template/components/product/products-slider.tsx
  - apps/template/components/product/related-products-section.tsx
  - apps/template/components/ui/slider.tsx
---

## Summary

Renames the horizontal-scroll primitive from `ScrollCarousel` → `Slider` and the wrapper from `ProductsCarousel` → `ProductsSlider`. The component is not infinite (it's a swipeable horizontal scroller with chevron navigation), so "carousel" was misleading. Also drops `py-5` from the outer `<section>` of the slider — that vertical padding was unjustified once `<Sections>` and `<Page>` started owning page-level rhythm.

File renames (via `git mv` to preserve history):

- `components/ui/scroll-carousel.tsx` → `components/ui/slider.tsx`
- `components/product/products-carousel.tsx` → `components/product/products-slider.tsx`

Identifier renames (matched 1:1):

- `ScrollCarousel` → `Slider`
- `ScrollCarouselContent` → `SliderContent`
- `ScrollCarouselHeader` → `SliderHeader`
- `ScrollCarouselItem` → `SliderItem`
- `ScrollCarouselNav` → `SliderNav`
- `ScrollCarouselTitle` → `SliderTitle`
- Internal: `ScrollCarouselContext` → `SliderContext`, `useScrollCarousel` → `useSlider`, `ScrollCarouselContextValue` → `SliderContextValue`
- `ProductsCarousel` → `ProductsSlider`, `ProductsCarouselProps` → `ProductsSliderProps`
- `data-slot` values: `scroll-carousel`, `scroll-carousel-{header,title,nav,content,item}` → `slider`, `slider-{header,title,nav,content,item}`. The `querySelector("[data-slot='scroll-carousel-item']")` inside `scroll()` is updated to match.

Spacing change:

- `<section>` outer wrapper of `<Slider>`: `cn("sm:overflow-x-clip sm:contain-[paint] py-5", className)` → `cn("sm:overflow-x-clip sm:contain-[paint]", className)`. The skeleton `<Fallback>` in `related-products-section.tsx` drops the matching `py-5` so geometry tracks the loaded state.

Docs:

- `apps/docs/content/docs/anatomy/pages/home.mdx` — `ProductsCarousel` → `ProductsSlider`, file path updated, "carousel" → "slider" in narrative.
- `apps/docs/content/docs/anatomy/pages/pdp.mdx` — same substitutions in the related-products section.

## Why it matters

- The component is a non-infinite horizontal scroller. Calling it a "carousel" implied looping behavior (or auto-rotation) that doesn't exist. "Slider" matches what it actually does.
- The outer `py-5` was applying 20px above and below every horizontal scroller — invisible cost on the home page, but it added unwanted gap on PDP related products. With page-level rhythm now owned by `<Page>` and `<Sections>`, internal padding on the primitive isn't paying its way.
- Skeleton `<Fallback>` geometry still tracks the loaded state since both lose `py-5` together.

## Apply when

- Storefront still imports from `@/components/ui/scroll-carousel` or `@/components/product/products-carousel`.
- Storefront still references `<ScrollCarousel>` / `<ProductsCarousel>` in JSX.
- Storefront still has `py-5` on the outer wrapper of the horizontal-scroll component.

## Safe to skip when

- Storefront has replaced the slider primitive entirely.
- Storefront's design language deliberately keeps the 20px vertical padding around the slider — in which case keep `py-5` on your local copy and rename only the identifiers.

## Notes

- File renames went through `git mv` so blame/history follows. The old paths will not exist after rollout — update any local references (storybook, scripts, tests) to the new paths.
- `data-slot` values changed too. Any storefront-specific CSS or test selectors targeting `[data-slot='scroll-carousel*']` need updating.
- One historical log entry (`2026-04-25-grid-gap-pilot.md`) still references `ScrollCarousel` in a "future considerations" footnote. Per the rollout-log append-only rule, that entry is left as historical record.

## Validation

1. `pnpm --filter template dev`.
2. `/products/[handle]`: related-products slider renders below product detail, scrolls horizontally, chevron nav works on lg+ when overflow exists. No visible 20px gap above/below the slider.
3. `/cart` (with items): related-products slider at the bottom, same rendering as PDP.
4. `/`: home page does not use the slider — verify the home grid still renders unaffected.
5. DevTools: `<section data-slot="slider">` (not `scroll-carousel`) is present. No `py-5` on the outer wrapper.
6. `pnpm --filter template lint` and `pnpm --filter template build` clean.
