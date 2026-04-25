---
title: PDP lightbox — add hidden DialogTitle to satisfy Radix a11y
changeKey: pdp-lightbox-dialog-title
introducedOn: 2026-04-25
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/lightbox.tsx
---

## Summary

Opening the PDP lightbox triggered two Radix Dialog console messages:

> `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

> Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.

Radix expects an actual `Dialog.Title` element (not just `aria-label`) and either a `Dialog.Description` or an explicit opt-out via `aria-describedby={undefined}`.

Fix: add a visually-hidden `<DialogPrimitive.Title className="sr-only">{label} enlarged</DialogPrimitive.Title>` inside `DialogContent`, drop the redundant `aria-label`, and set `aria-describedby={undefined}` since the lightbox has no descriptive text beyond the title.

## Why it matters

- Removes accessibility warnings that show up for any user opening browser dev tools on a PDP.
- Gives screen-reader users a real heading for the lightbox instead of a synthetic accessible-name.

## Apply when

- The storefront still uses `components/product-detail/lightbox.tsx` largely as shipped (Radix Dialog primitives, no wrapper around Title/Description).

## Safe to skip when

- The storefront has replaced the lightbox with a different modal/lightbox library that handles the a11y contract differently.

## Validation

1. `pnpm --filter template dev`. Open a PDP, click an image to open the lightbox.
2. Browser console: confirm there is no longer a Radix Dialog title or description warning.
3. Screen-reader spot-check (VoiceOver or NVDA): confirm the lightbox announces "{product title} enlarged" when it opens.
