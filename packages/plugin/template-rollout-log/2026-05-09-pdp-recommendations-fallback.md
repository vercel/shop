---
title: Add recommended products skeleton to PDP fallback
changeKey: pdp-recommendations-fallback
introducedOn: 2026-05-09
changeType: fix
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-page.tsx
  - apps/template/components/product/related-products-section.tsx
---

## Summary

The product detail page fallback now reserves space for the recommended products section while the PDP content is suspended.

## Why it matters

The real PDP renders product details followed by recommended products. The previous top-level fallback only covered the product media/details area, so the page could shift when recommendations streamed in.

## Migration in this PR

- `ProductPageFallback` renders `RelatedProductsSectionSkeleton` after the product detail skeleton.
- `RelatedProductsSectionSkeleton` can render a title skeleton when no translated title is available.

## Apply when

- The storefront uses the template PDP fallback and renders related/recommended products below PDP content.

## Safe to skip when

- The storefront removed the recommended products section or has a custom PDP loading state that already reserves this space.

## Validation

1. Load a PDP cold or under throttled network conditions.
2. Confirm the fallback includes both the product detail area and recommended-product card row.
3. Confirm the page does not jump when recommendations stream in.
