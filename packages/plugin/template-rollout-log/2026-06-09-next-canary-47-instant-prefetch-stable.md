---
title: Next 16.3.0-canary.47 — stabilize instant/prefetch route config, drop explicit appShells
changeKey: next-canary-47-instant-prefetch-stable
introducedInVersion: 0.1.0
introducedOn: 2026-06-09
changeType: dependency
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/next.config.ts
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/app/search/page.tsx
  - apps/template/app/collections/[handle]/page.tsx
  - apps/template/app/collections/all/page.tsx
relatedSkills:
  - /vercel-shop:enable-i18n
---

## Summary

Bumped `next` from `16.3.0-canary.46` to `16.3.0-canary.47` and migrated the route segment config APIs that canary.47 stabilized/renamed:

- `export const unstable_instant = true` → `export const instant = true`
- `export const unstable_prefetch = "force-runtime"` → `export const prefetch = "allow-runtime"`
- Removed `experimental.appShells: true` from `next.config.ts` — App Shells is now enabled by default whenever `cacheComponents` is on, so the explicit flag is redundant.

The object form of the instant config also renamed its build-validation samples property: `instant = { samples: [...] }` → `instant = { unstable_samples: [...] }`. The template uses the boolean form, so only the `enable-i18n` skill (which uses the object form) was affected.

## Why it matters

The old export names and the `force-runtime` value are no longer recognized in canary.47 — Next reads only `instant`, `prefetch`/`allow-runtime`, and `instant.unstable_samples`. Leaving the old names in place silently drops the instant/prefetch route configuration (the validation and runtime prefetching stop applying) rather than erroring, so the regression is easy to miss.

## Apply when

The downstream storefront is upgrading `next` to `16.3.0-canary.47` or later and copied any of the affected route segment exports or the `appShells` config.

## Safe to skip when

Still pinned to `16.3.0-canary.46` or earlier — the old names are required there. Adopt this only together with the Next upgrade.

## Validation

- `pnpm build` in `apps/template` compiles with no warnings about `instant`, `prefetch`, or `appShells`.
- `grep -rn "unstable_instant\|unstable_prefetch\|force-runtime" app/` returns nothing.
- Collection, product, and search routes still report Partial Prerender (◐) in the build route table.
