---
title: Merge product-detail-section.tsx into product-detail-page.tsx
changeKey: pdp-section-merged
introducedOn: 2026-05-13
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/product-detail-page.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
---

## Summary

`components/product-detail/product-detail-section.tsx` is folded into `components/product-detail/product-detail-page.tsx`. The section was only imported by the page; splitting it into a separate file added a file boundary without a reuse boundary. The merged file reads top-to-bottom: imports → `ProductBreadcrumbSchema` → `ProductPageFallback` → exported `ProductDetailPage` → inner `ProductContent` (Suspense unwrap) → inner `ProductDetailSection` (the page body) → `Resolved*` streaming helpers.

`ProductDetailSection` is no longer exported — it's an internal function. The public surface stays unchanged: `ProductDetailPage` is still the only export and its props are identical.

## Why it matters

The template has one PDP route and one consumer of `ProductDetailSection`. Two files for one rendering pipeline meant flipping between them to follow the orchestration; one file lets a reader (human or agent) see schema emission, Suspense boundaries, single-variant fast paths, and streaming fallbacks in a single scroll. No behavior change.

This is a follow-on to the broader "template is forked, not depended on" thread: when a split exists to support an imagined-but-unrealized consumer, the split is paying rent for nothing.

## Apply when

- The downstream storefront imports `ProductDetailPage` only and never reaches into `product-detail-section.tsx` directly.

## Safe to skip when

- The fork imports `ProductDetailSection` directly (rare — it was exported but only used by the page). In that case, either re-export it from `product-detail-page.tsx` or keep the section file locally.
- The fork has a custom PDP page that composes its own section variant on top of `ProductDetailSection`.

## Notes

- Docs updated: `apps/docs/content/docs/anatomy/pages/pdp.mdx` no longer lists the section file; the page-file description now covers the orchestration role.
- The earlier rollout entries (`2026-04-25-grid-gap-pilot`, `2026-05-04-pdp-aspect-ratio-and-oos-slideshow`, `2026-05-06-pdp-color-gallery-fallback`) reference the section path. Those entries are append-only history; for forks adopting them today, treat the section path as `product-detail-page.tsx`.

## Validation

1. `pnpm --filter template lint` clean.
2. `pnpm --filter template dev`. Visit a PDP. Verify:
   - Page-level Suspense skeleton renders (carousel skeleton + 2×2 grid skeletons + info skeletons).
   - Single-variant product renders without streaming placeholders for price/options/buy buttons (eager path).
   - Multi-variant product shows streamed price/options/buy buttons after a brief skeleton.
   - Color-partitioned product shows desktop grid and mobile carousel color slots correctly.
3. Verify the JSON-LD `Product` and `BreadcrumbList` schemas still emit (View Source on a PDP).
