---
title: Cart — unify slideover for mobile and desktop, drop bottom drawer
changeKey: cart-unified-slideover
introducedOn: 2026-04-26
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/cart/overlay.tsx
  - apps/template/components/ui/sheet.tsx
  - apps/docs/content/docs/anatomy/cart.mdx
---

## Summary

The cart overlay used to branch on viewport: a right-side `Sheet` on `md+` and a bottom-up `Drawer` (vaul) on mobile, picked by `useMediaQuery("(min-width: 768px)")`. The branching duplicated the header markup, made the cart a `useMediaQuery` hydration surface, and gave mobile users a different interaction model than desktop with no real benefit.

This change collapses both branches to a single `Sheet` with `side="right"` and `className="p-0 gap-0"`. The `Drawer`-related imports and the `useMediaQuery` call are removed from `components/cart/overlay.tsx`.

The `Sheet` primitive's left/right width defaults are also retuned (`apps/template/components/ui/sheet.tsx`) from the shadcn baseline `w-3/4 sm:max-w-sm` to `w-[calc(100%-2.5rem)] max-w-md`. Slideovers now leave a consistent `gap-10` (40px) of backdrop visible on mobile and cap at `28rem` on larger screens. This applies uniformly to every Sheet consumer in the template: the cart slideover, the mobile menu, and the collection filter sidebar — so they all share the same visual rhythm.

A related fix moves the `Sheet` close button's focus styles from `focus:` to `focus-visible:` (`apps/template/components/ui/sheet.tsx`) so the ring only renders for keyboard users. Without this, Radix Dialog's auto-focus on open made the close button render with a visible ring on touch open in the now-shared mobile slideover (and in the mobile menu sheet).

## Why it matters

- One interaction model across viewports — fewer surprises and one less `useMediaQuery` SSR/CSR mismatch surface.
- Removes the duplicate header (title + count badge) that previously had to be kept in sync between the `Sheet` and `Drawer` branches.
- Restores design parity for the close button across every `Sheet` consumer (cart slideover, mobile menu, and filter sidebar).
- Brings the slideover width and backdrop gap into a single design rule so the cart, mobile menu, and filter sidebar feel like the same component family on mobile.

## Apply when

- The storefront has not customized `components/cart/overlay.tsx` to keep the bottom drawer on mobile intentionally.
- `components/ui/sheet.tsx` close-button styling has not already been migrated to `focus-visible:`.

## Safe to skip when

- The storefront has deliberately replaced the cart UI with a bottom-drawer-on-mobile pattern that matches its product or brand language.
- The storefront's `sheet.tsx` already uses `focus-visible:` (ring will not regress).

## Notes

- `components/ui/drawer.tsx` is still used by `components/ui/select-panel.tsx` for the mobile filter drawer, so the file is intentionally left in place. Don't delete it.
- Docs site copy in `apps/docs/content/docs/anatomy/cart.mdx` is updated to reflect the unified slideover and the removed `useMediaQuery` dependency.

## Validation

1. `pnpm --filter template dev`.
2. Mobile width: tap the cart icon — confirm the cart slides in from the right, fills the viewport, and the X close button renders bare (no ring around it). Tab from the keyboard — the focus ring should appear on the X.
3. Mobile width: tap the hamburger — confirm the menu's X close button is also bare on touch open.
4. Desktop width (≥768px): cart slideover should be unchanged visually (right-side sheet capped at `max-w-md`).
5. Add a product, reopen — items list, summary, and checkout button render correctly.
