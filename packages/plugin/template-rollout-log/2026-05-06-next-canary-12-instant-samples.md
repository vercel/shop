---
title: Next canary 12 instant samples rename
changeKey: next-canary-12-instant-samples
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

The template now uses `next@16.3.0-canary.12` and renames `unstable_instant.samples` to `unstable_instant.unstable_samples` on routes that provide instant navigation sample data.

## Why it matters

Next canary 12 rejects the old `samples` key in `unstable_instant` segment config, so storefronts that keep the old key fail route segment config validation during build.

## Apply when

Adopt this when upgrading a storefront to Next 16.3 canary 12 or newer while using `unstable_instant` object config with sample params, search params, cookies, or headers.

## Safe to skip when

Skip this for storefronts still pinned before Next 16.3 canary 12 or storefronts that only use `unstable_instant = true` / `false` without sample data.

## Validation

Run `pnpm build` and confirm Next accepts the affected route segment configs.
