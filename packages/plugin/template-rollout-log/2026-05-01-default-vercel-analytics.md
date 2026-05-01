---
title: Enable Vercel Analytics and Speed Insights by default
changeKey: default-vercel-analytics
introducedOn: 2026-05-01
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/layout.tsx
  - apps/template/components/analytics.tsx
  - apps/template/package.json
  - pnpm-lock.yaml
relatedSkills:
  - /vercel-shop:enable-analytics
---

## Summary

The template now installs `@vercel/analytics` and `@vercel/speed-insights`, renders both from `components/analytics.tsx`, and mounts the component from the root layout after the app provider.

## Why it matters

Downstream storefronts get first-party page analytics and Core Web Vitals monitoring without additional setup.

## Apply when

- The storefront deploys to Vercel and wants built-in traffic and performance monitoring.
- The storefront has not already added a custom analytics wrapper.

## Safe to skip when

- The storefront intentionally avoids client-side analytics scripts.
- The storefront already has an equivalent analytics/performance integration and does not want duplicate reporting.

## Validation

1. `pnpm --filter template lint` should pass.
2. `pnpm --filter template build` should include no import errors for `@vercel/analytics/next` or `@vercel/speed-insights/next`.
3. Confirm `<AnalyticsComponents />` renders as a sibling after `NextIntlClientProvider` in `apps/template/app/layout.tsx`.
