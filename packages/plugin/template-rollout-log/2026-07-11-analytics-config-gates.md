---
title: Add analytics configuration gates
changeKey: analytics-config-gates
introducedOn: 2026-07-11
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/shop.config.ts
  - apps/template/lib/config.ts
  - apps/template/app/layout.tsx
relatedSkills:
  - /vercel-shop:enable-analytics
---

## Summary

The template now configures analytics in `shop.config.ts`. The `analytics.vercel.enabled` and `analytics.speedInsights.enabled` integration gates each default to `false`.

The root layout imports each provider component directly and renders it only when its integration is enabled.

## Why it matters

Storefronts retain built-in support for Vercel Web Analytics and Speed Insights without loading either integration until it is intentionally enabled.

## Apply when

- The storefront uses Vercel Web Analytics or Speed Insights.
- Analytics integrations should be explicit, independently configurable choices.

## Safe to skip when

- Analytics is managed by a separate consent or tag-management layer.
- The storefront has already replaced the root layout integrations with an equivalent configuration system.

## Validation

1. Keep both integration gates disabled and confirm neither component renders.
2. Enable each integration independently and confirm only the selected component renders.
3. Run template type checking and linting, then run the docs path linter.
