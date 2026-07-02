---
title: Remove experimental inlineCss from next.config
changeKey: remove-experimental-inline-css
introducedInVersion: 0.1.0
introducedOn: 2026-07-02
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/next.config.ts
---

## Summary

Dropped the `experimental.inlineCss: true` flag from the template's `next.config.ts`. The `experimental` block held only that key, so the whole block is gone and the template now uses Next's default CSS delivery (external `<link>` stylesheets) instead of inlining CSS into the document `<style>`.

## Why it matters

`inlineCss` is an experimental Next flag whose behavior and tradeoffs can shift between releases. Inlining removes a render-blocking request but repeats CSS in every HTML payload (uncacheable across navigations) and grows the streamed document. Reverting to the default keeps the template on stable, well-understood CSS delivery and off an experimental knob.

## Apply when

Adopt this if your storefront tracks the template's default config and you want to stay off experimental Next flags, or you have seen duplicated/inlined CSS bloat in HTML responses.

## Safe to skip when

Skip if you deliberately enabled `experimental.inlineCss` for a measured first-paint win on your storefront and want to keep it. This is a conscious performance tradeoff, not a correctness fix.

## Validation

Run `pnpm build` in `apps/template` and confirm the build succeeds. Load a page and confirm CSS now arrives via `<link rel="stylesheet">` in the head rather than inlined `<style>` blocks.
