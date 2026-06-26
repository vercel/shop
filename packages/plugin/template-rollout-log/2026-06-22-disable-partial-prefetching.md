---
title: Disable global partial prefetching (partialPrefetching = false)
changeKey: disable-partial-prefetching
introducedOn: 2026-06-22
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/next.config.ts
relatedSkills: []
---

## Summary

Flip `partialPrefetching` from `true` to `false` in `next.config.ts`. The key stays present (explicitly `false`) to document the deliberate choice.

`partialPrefetching` is the global default for route-segment prefetch when a segment does not export its own `prefetch`. With it on, Next defaults such segments to `prefetch: 'partial'` — an in-viewport `<Link>` (the `prefetch: 'auto'` default) carries only the per-route App Shell. With it off, those segments fall back to the standard prefetch default (`undefined`); routes that export their own `prefetch` are unaffected.

In this template, `app/search/page.tsx` is the only route that still exports `prefetch = "allow-runtime"`, so it keeps runtime prefetch either way. Every other route (home, PDP, `collections/[handle]`, `collections/all`) currently relies on the global default, so this change moves them off `'partial'` and back to the standard prefetch behavior.

## Why it matters

- Backs out the partial-prefetch experiment (`Experiment: partial prefetching`, #322). Returns the template to Next's default prefetch model for segments without an explicit `prefetch` export.
- `partialPrefetching` requires `cacheComponents`; since `cacheComponents: true` stays on, setting the flag to `false` is the only change and builds with no further edits.

## Apply when

- The storefront wants Next's default prefetch behavior rather than the partial App-Shell-only prefetch, or is otherwise reverting the #322 experiment.

## Safe to skip when

- The storefront deliberately runs partial prefetching to minimize prefetch payloads on link-dense pages (it carries only the per-route App Shell into in-viewport links). Keep `true` in that case.
- You have re-added explicit `prefetch` exports to the PDP/collection routes; those routes are then driven by their own export and are unaffected by this global flag.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` succeed.
2. `grep -n partialPrefetching apps/template/next.config.ts` → `false`.
3. The build route table still reports Partial Prerender (◐) for the static-shell routes — partial *prerendering* (PPR via `cacheComponents`) is independent of the `partialPrefetching` prefetch default.

## See also

- `drop-link-prefetch-true` (2026-06-21) — dropped `prefetch={true}` from product-card and menu links; described the `partialPrefetching: true` behavior this entry turns off.
- `pdp-allow-runtime-prefetch` (2026-06-10) — added (since removed) the PDP `prefetch = "allow-runtime"` export.
- `next-canary-47-instant-prefetch-stable` (2026-06-09) — stabilized the `instant` / `prefetch` route segment config.
</content>
</invoke>
