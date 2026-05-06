---
title: Next canary 12 instant validation default
changeKey: next-canary-12-instant-validation-default
introducedInVersion: 0.1.0
introducedOn: 2026-05-06
changeType: dependency
defaultAction: adopt
appliesTo:
  - all
paths:
  - app/products/[handle]/page.tsx
  - app/collections/[handle]/page.tsx
  - app/search/page.tsx
---

## Summary

The template now uses `next@16.3.0-canary.12` and keeps instant navigation route config at `unstable_instant = true` without sample data.

## Why it matters

Next canary 12 defaults `experimental.instantInsights.validationLevel` to `manual-warning`, which preserves development warnings but disables build-time validation. Sample data is only needed for undocumented build-validation levels such as `experimental-manual-error`.

## Apply when

Adopt this when upgrading a storefront to Next 16.3 canary 12 or newer and staying on the default instant validation behavior.

## Safe to skip when

Skip this only if the storefront intentionally opts into an undocumented build-validation level and is prepared to maintain `unstable_samples` until Next reworks the sample/scenario API.

## Validation

Run `pnpm build` and confirm Next accepts the affected route segment configs.
