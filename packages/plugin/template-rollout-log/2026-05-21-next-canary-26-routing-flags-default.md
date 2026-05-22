---
title: Next canary 26 — varyParams, optimisticRouting, cachedNavigations enabled by default
changeKey: next-canary-26-routing-flags-default
introducedOn: 2026-05-21
changeType: dependency
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/package.json
  - apps/docs/package.json
  - apps/template/next.config.ts
  - pnpm-lock.yaml
---

## Summary

Bumps Next.js to `16.3.0-canary.26` in both apps. canary.26 flips three experimental flags on by default — `experimental.varyParams`, `experimental.optimisticRouting`, and `experimental.cachedNavigations` (the last automatically when `cacheComponents` is on) — so all three keys are removed from `apps/template/next.config.ts`. Supersedes [[2026-05-21-next-vary-params]].

## Why it matters

Keeps the template on the latest Next.js canary so the cache-components / Turbopack / instant-navigation paths under active development are exercised. Removing the now-default keys prevents a noisy build warning and a future hard error when Next removes the experimental key.

## Apply when

Storefront is upgrading to Next.js 16.3.0-canary.26 or newer.

## Safe to skip when

Storefront is pinned to an older Next.js canary that still gates these flags behind explicit opt-in, or has hit a regression with one of the three behaviors and is intentionally turning it off via the experimental key.

## Validation

1. `pnpm install` resolves cleanly with the existing `minimumReleaseAgeExclude` entries for `next` and `@next/*`.
2. `pnpm --filter template build` and `pnpm --filter docs build` succeed with no warnings about removed experimental flags.
3. `pnpm --filter template lint` passes.
