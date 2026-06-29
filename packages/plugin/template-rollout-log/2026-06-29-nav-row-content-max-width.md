---
title: Cap the nav row to the content max-width via the shared Container
changeKey: nav-row-content-max-width
introducedOn: 2026-06-29
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/nav/index.tsx
---

## Summary

The nav's inner row hand-rolled `mx-auto … px-5 lg:px-10` but set no max-width, so on viewports wider than the content cap (`max-w-[96rem]`) the nav items ran to the screen edges while page content and the announcement bar stayed centered. Wrapped the inner row in the shared `Container` primitive (`mx-auto w-full max-w-[96rem] px-5 lg:px-10`) instead, keeping the outer `<nav>` full-bleed so its background still spans the viewport.

## Why it matters

Every other top-level section (page `Container`, announcement bar) is capped at `max-w-[96rem]` and centered. The uncapped nav drifted out of alignment with that column on large/ultrawide displays — the logo and cart icon sat hard against the viewport edges instead of lining up with the page content below. Using `Container` ties the nav to the same token, so a future change to the content cap moves the nav with it.

## Why via Container, not a literal max-width

`Container` is the single source of truth for the content column (`mx-auto w-full max-w-[96rem] px-5 lg:px-10`). Re-using it keeps the nav from re-declaring the cap and padding by hand, which is exactly the drift that caused the bug.

## Apply when

- The storefront still uses the template nav whose inner row applies `mx-auto`/padding without a max-width.

## Safe to skip when

- The nav was rewritten (e.g. centered-logo + mega menu) with its own width strategy, or the storefront intentionally wants a full-bleed nav row.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit`.
2. At a >1536px viewport, the nav's left/right content edges line up exactly with a page `Container` and the announcement bar.
3. The nav background still spans the full viewport width (only the content is constrained).
