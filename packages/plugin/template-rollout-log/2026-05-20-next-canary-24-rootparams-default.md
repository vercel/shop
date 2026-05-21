---
title: Next canary 24 — rootParams enabled by default
changeKey: next-canary-24-rootparams-default
introducedOn: 2026-05-20
changeType: dependency
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/package.json
  - apps/docs/package.json
  - apps/template/next.config.ts
  - packages/plugin/skills/enable-i18n/SKILL.md
  - pnpm-lock.yaml
---

## Summary

Bumps Next.js to `16.3.0-canary.25` in both apps. Starting at canary.24, `next/root-params` is available without a flag, so `experimental.rootParams: true` was removed from `apps/template/next.config.ts`. The `enable-i18n` skill no longer instructs storefronts to add the flag.

## Why it matters

Keeps the template on the latest Next.js canary so the cache-components / Turbopack / instant-navigation paths under active development are exercised. Removing the obsolete flag prevents a noisy build warning and a future hard error when Next removes the experimental key.

## Apply when

Storefront is upgrading to Next.js 16.3.0-canary.24 or newer.

## Safe to skip when

Storefront is pinned to an older Next.js canary that still gates `next/root-params` behind the flag.

## Validation

1. `pnpm install` resolves cleanly with the existing `minimumReleaseAgeExclude` entries for `next` and `@next/*`.
2. `pnpm --filter template build` and `pnpm --filter docs build` succeed with no `experimental.rootParams is no longer needed` warning.
3. `import { locale } from "next/root-params"` continues to work in `lib/params.ts` and any locale-aware code paths added by `enable-i18n`.
