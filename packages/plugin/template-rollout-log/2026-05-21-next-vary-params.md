---
title: Re-enable Next vary params
changeKey: next-vary-params
introducedOn: 2026-05-21
changeType: dependency
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/next.config.ts
---

## Summary

Re-enables Next.js canary's `experimental.varyParams: true` flag in `apps/template/next.config.ts`. Previously enabled in #265, reverted on 2026-05-08, now restored on top of `next@16.3.0-canary.25`.

## Why it matters

`varyParams` lets the template exercise the request-variant behavior the current Next canary is built around, and it's one of the five flags `experimental.appShells` requires (cacheComponents, prefetchInlining, varyParams, optimisticRouting, cachedNavigations). Keeping varyParams on closes the gap to App Shells.

## Apply when

Storefront is on a Next.js canary that supports `experimental.varyParams` (canary.21+).

## Safe to skip when

Storefront has hit a varyParams-specific bug and is intentionally pinning to the flag off.

## Validation

1. `pnpm --filter template build` succeeds.
2. `pnpm --filter template lint` passes.
