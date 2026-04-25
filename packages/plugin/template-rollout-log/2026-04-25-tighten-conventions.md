---
title: Tighten conventions — directive-suffix split, interface Props, React.ComponentProps
changeKey: tighten-conventions-props-and-splits
introducedOn: 2026-04-25
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
  - apps/template/components/ui/country-flag.tsx
  - apps/template/components/product-detail/auto-play-video.tsx
  - apps/template/components/product-detail/about-item.tsx
  - apps/template/components/product-detail/color-picker.tsx
  - apps/template/components/product-detail/option-picker.tsx
  - apps/template/components/product-detail/product-info.tsx
  - apps/template/components/product-detail/product-price.tsx
  - apps/template/components/product/discount-badge.tsx
  - apps/template/components/product/price.tsx
---

## Summary

Three small convention tightenings, no behavior changes.

1. **AGENTS.md split-files rule rewritten to match what's actually shipped.** The prior text prescribed `client-components.tsx` / `server-components.tsx` / `components.tsx` filenames for directive splits. The codebase already uses the `*-client.tsx` suffix everywhere (`sidebar.tsx` + `sidebar-client.tsx`, `mobile-tabs.tsx` + `mobile-tabs-client.tsx`, `cart.tsx` + `cart-client.tsx`). AGENTS.md now codifies the suffix form and notes the symmetric `*-server.tsx` for the inverse case.

2. **`interface FooProps` everywhere (was: two stragglers using `type`).**
   - `components/ui/country-flag.tsx`: `type CountryFlagProps = { ... }` → `interface CountryFlagProps { ... }`
   - `components/product-detail/auto-play-video.tsx`: `type AutoPlayVideoProps = Omit<...> & { ... }` → `interface AutoPlayVideoProps extends Omit<...> { ... }`
   - AGENTS.md now states this explicitly under Naming.

3. **`React.ComponentProps<"X">` everywhere (was: `ComponentPropsWithoutRef<"X">` in product/product-detail).** Refs are regular props in React 19, so the `WithoutRef` distinction is no longer meaningful, and the rest of the codebase (`components/ui/*`) already uses the `React.ComponentProps` form via `import type * as React from "react"`. Converted 7 files in `components/product/*` and `components/product-detail/*`. AGENTS.md now states this under Naming.

`components/ui/drawer.tsx` is intentionally left on `React.ComponentPropsWithoutRef`. It's the older shadcn `forwardRef` + `React.ElementRef` pattern; converting it requires a wider rewrite of every `forwardRef` block, which is out of scope here and worth doing as a coordinated drawer-modernization PR.

## Why it matters

- Convention docs match reality, so an agent reading AGENTS.md doesn't try to introduce a third filename pattern that no file uses.
- One `Props` declaration form across the codebase (interface), so consumers can declaration-merge or extend without hitting the `type` vs `interface` mismatch.
- One `ComponentProps` form, so future grepping for native-element pass-through is consistent.

## Apply when

- The storefront still uses the affected files largely as shipped.
- The storefront is happy to align with the modern React 19 `ComponentProps` form.

## Safe to skip when

- The storefront has its own conventions document and prefers to keep `type`-style Props or `ComponentPropsWithoutRef`.
- The storefront has restructured `components/product*` such that the listed files no longer exist.

## Validation

1. `pnpm --filter template build` — clean (the pre-existing i18n typecheck errors on main are unrelated).
2. `git grep "ComponentPropsWithoutRef" apps/template/components` returns only `components/ui/drawer.tsx` (the deliberate exclusion) and `components/ai-elements/*` (vendored).
3. `git grep "type [A-Z][a-zA-Z]*Props =" apps/template/components` returns only files in `components/ai-elements/*` (vendored).
4. `git grep "client-components\.tsx\|server-components\.tsx" apps/template` returns no results.
5. PDP renders normally (color picker, option picker, price, discount badge, autoplay video, lightbox).
