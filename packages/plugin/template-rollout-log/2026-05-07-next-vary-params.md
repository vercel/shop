---
title: Next vary params
changeKey: next-vary-params
introducedInVersion: 0.1.0
introducedOn: 2026-05-07
changeType: dependency
defaultAction: adopt
appliesTo:
  - all
paths:
  - next.config.ts
---

## Summary

The template now enables Next.js canary's experimental `varyParams` flag.

## Why it matters

`varyParams` lets downstream storefronts adopt the same request-variant behavior expected by the template's current Next canary.

## Apply when

Adopt this when upgrading a storefront to a Next canary that supports `experimental.varyParams`.

## Safe to skip when

Skip this if the storefront is staying on a Next version that does not recognize `experimental.varyParams`.

## Validation

Run `pnpm build` and confirm Next accepts the config.
