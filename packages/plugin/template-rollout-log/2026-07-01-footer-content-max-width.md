---
title: Cap the footer to the content max-width via the shared Container
changeKey: footer-content-max-width
introducedOn: 2026-07-01
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/footer/index.tsx
---

## Summary

The footer's inner wrapper hand-rolled `mx-auto … px-5 lg:px-10` but set no max-width, so on viewports wider than the content cap (`max-w-[96rem]`) the footer columns, copyright, and social links ran to the screen edges while page content, the announcement bar, and the nav stayed centered. Wrapped the inner content in the shared `Container` primitive (`mx-auto w-full max-w-[96rem] px-5 lg:px-10`) instead, keeping the outer `<footer>` full-bleed and preserving the footer's vertical padding (`pt-20 pb-10`, plus the conditional `pb-22` that clears the agent ActionBar pill).

This is the same treatment applied to the nav in [nav-row-content-max-width](./2026-06-29-nav-row-content-max-width.md); the footer had the identical uncapped-row drift.

## Why it matters

Every other top-level section (page `Container`, announcement bar, nav row) is capped at `max-w-[96rem]` and centered. The uncapped footer drifted out of alignment with that column on large/ultrawide displays — the first/last footer columns and the copyright/social row sat hard against the viewport edges instead of lining up with the page content above. Using `Container` ties the footer to the same token, so a future change to the content cap moves the footer with it.

## Why via Container, not a literal max-width

`Container` is the single source of truth for the content column (`mx-auto w-full max-w-[96rem] px-5 lg:px-10`). Re-using it keeps the footer from re-declaring the cap and padding by hand, which is exactly the drift that caused the bug. The footer-specific vertical padding stays on the `Container` via `className`.

## Apply when

- The storefront still uses the template footer whose inner wrapper applies `mx-auto`/padding without a max-width.

## Safe to skip when

- The footer was rewritten with its own width strategy, or the storefront intentionally wants a full-bleed footer row.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit`.
2. At a >1536px viewport, the footer's left/right content edges line up exactly with a page `Container`, the announcement bar, and the nav.
3. The footer still spans the full viewport width if it carries a background (only the content is constrained), and the agent ActionBar clearance (`pb-22`) still applies when the agent is enabled.
