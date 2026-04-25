---
title: Drawer — modernize off forwardRef / ElementRef / ComponentPropsWithoutRef
changeKey: drawer-modernize-no-forwardref
introducedOn: 2026-04-25
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/ui/drawer.tsx
---

## Summary

`components/ui/drawer.tsx` was the last UI primitive on the legacy shadcn pattern: every part used `React.forwardRef<React.ElementRef<typeof X>, React.ComponentPropsWithoutRef<typeof X>>` plus a manual `displayName`. React 19 makes `ref` a regular prop, so all of that boilerplate is unnecessary.

Rewritten to match `sheet.tsx` / `dialog.tsx` / `popover.tsx`:

- `function Foo()` declarations, no `React.forwardRef`.
- `React.ComponentProps<typeof DrawerPrimitive.Foo>` (refs flow through `{...props}` automatically).
- `import type * as React from "react"` (no value import — `React.forwardRef` is gone).
- Added `data-slot="drawer-..."` attributes to every part, matching the convention used by every other UI primitive in `components/ui/`.
- Dropped manual `displayName` assignments — function names give React DevTools the right label.
- `Drawer` keeps the `shouldScaleBackground = true` default for parity with the old behavior.

No public API change. Every export is preserved by name (`Drawer`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger`).

Ref forwarding still works: consumers passing `ref={...}` to any drawer part end up forwarding it to the underlying vaul element via `{...props}`.

## Why it matters

- One pattern across `components/ui/`. Easier to read, easier to copy when adding a new primitive.
- Strips ~30% of the file. The `forwardRef<ElementRef, ComponentPropsWithoutRef>` shapes are gone, plus the `displayName` lines.
- Picks up the `data-slot` styling hooks the rest of the UI primitives offer.

## Apply when

- The storefront still uses `components/ui/drawer.tsx` largely as shipped.
- The storefront is on React 19 (the template is).

## Safe to skip when

- The storefront has restructured the drawer or moved to a different drawer/sheet primitive.
- The storefront has consumers that depend on the legacy `displayName` strings (e.g. snapshot tests asserting `DrawerOverlay.displayName === "DrawerOverlay"`).

## Validation

1. `pnpm --filter template dev`. Open the cart overlay (`components/cart/overlay.tsx` consumes `Drawer` on mobile via the cart icon) — confirm it slides up from the bottom, dismisses on backdrop tap, and announces title/description to screen readers as before.
2. On a collection page at mobile width, open the filter sheet (`components/ui/select-panel.tsx` wraps `Drawer` for mobile filters) — confirm the same behavior.
3. DevTools → Elements: confirm every drawer part now carries a `data-slot="drawer-*"` attribute.
4. `git grep "forwardRef\|ElementRef" apps/template/components/ui/drawer.tsx` returns no results.
