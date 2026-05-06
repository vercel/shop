---
title: PDP gallery narrows variant suspension to the first image
changeKey: pdp-first-image-suspense
introducedOn: 2026-05-06
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/product-media.tsx
  - apps/template/lib/product.ts
---

## Summary

The PDP gallery now renders its default color-partitioned images immediately and narrows `variant` search-param resolution to the first image position that may need to change for a URL-selected variant.

## Why it matters

Color-partitioned PDP galleries no longer put the whole color image slot behind Suspense just to resolve the selected variant image. This keeps the gallery shell and default color images streaming earlier while preserving URL-selected variant image ordering once `searchParams` resolves.

## Apply when

- The storefront uses the template PDP gallery with Shopify variant images assigned by color.
- PDP navigation or preview performance is sensitive to gallery Suspense boundaries.

## Safe to skip when

- The storefront has replaced the PDP gallery or does not use color-based variant image filtering.
- The storefront prefers blocking the whole gallery until the URL-selected variant is fully resolved to avoid any first-image swap.

## Validation

1. Run template lint and build.
2. Open a color-partitioned PDP with a `?variant=` query that changes the first gallery image and confirm the selected variant image still becomes first.
3. Open a PDP whose variant does not change gallery images and confirm the gallery renders without an all-gallery skeleton wait.
