---
title: Improve default mobile menu spacing
changeKey: mobile-menu-spacing
introducedInVersion: 0.1.0
introducedOn: 2026-04-15
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/layout/nav/mobile-menu.tsx
---

## Summary

The default mobile navigation sheet now adds top breathing room below the close button and renders each link as a padded, rounded touch target.

## Why it matters

Without the extra spacing, the first menu item sits too close to the top edge of the sheet and the links read like bare text instead of tap-friendly navigation rows.

## Apply when

Apply this when a storefront still uses the template's default mobile menu or a lightly customized version of it.

## Safe to skip when

Skip this if the storefront already has a custom mobile drawer layout with its own spacing and touch-target treatment.

## Validation

- Open the mobile menu on a narrow viewport.
- Confirm the first link sits clearly below the close button.
- Confirm each menu item has horizontal padding and a visible hover or focus background state.
