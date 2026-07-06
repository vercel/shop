---
title: Migrate UI primitives from Radix to Base UI
changeKey: ui-radix-to-base-ui
introducedOn: 2026-07-05
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components.json
  - apps/template/package.json
  - apps/template/components/ui/accordion.tsx
  - apps/template/components/ui/badge.tsx
  - apps/template/components/ui/breadcrumb.tsx
  - apps/template/components/ui/button.tsx
  - apps/template/components/ui/button-group.tsx
  - apps/template/components/ui/collapsible.tsx
  - apps/template/components/ui/command.tsx
  - apps/template/components/ui/dialog.tsx
  - apps/template/components/ui/dropdown-menu.tsx
  - apps/template/components/ui/hover-card.tsx
  - apps/template/components/ui/label.tsx
  - apps/template/components/ui/popover.tsx
  - apps/template/components/ui/select.tsx
  - apps/template/components/ui/separator.tsx
  - apps/template/components/ui/sheet.tsx
  - apps/template/components/ui/switch.tsx
  - apps/template/components/ui/tooltip.tsx
  - apps/template/components/product-detail/lightbox.tsx
  - apps/template/components/nav/search-modal.tsx
  - apps/template/components/nav/mobile-menu.tsx
  - apps/template/components/collections/filter-sidebar-sheet.tsx
  - apps/template/components/collections/sort-select.tsx
  - apps/template/components/ai-elements/message.tsx
  - apps/template/components/ai-elements/prompt-input.tsx
  - apps/template/components/ai-elements/chain-of-thought.tsx
---

## Summary

The `components/ui/` layer now wraps **Base UI** (`@base-ui/react@1.6.0`) instead of Radix. `radix-ui` and `cmdk` are removed from `package.json`; the storefront has zero Radix in its dependency tree. This stays on shadcn/ui's supported path: `components.json` `style` is now `base-nova` (the `base-*` prefix selects Base UI; `radix-*` selects Radix), so `shadcn add` pulls Base-UI-backed component variants. Component look and behavior are preserved.

Mechanical translations applied to every migrated component:

- **Composition:** Radix `asChild` + `Slot` → Base UI `render` prop. The cva atoms (`button`, `badge`, `breadcrumb`, `button-group`) are built on `useRender` + `mergeProps` and **keep a back-compat `asChild` alias** that maps a single child to `render` — existing `<Button asChild><Link/></Button>` call sites keep working. Base UI trigger parts (`DialogTrigger`, `SheetTrigger`, `DropdownMenuTrigger`, `TooltipTrigger`) do **not** support `asChild`; their call sites were converted to `render` (silent runtime breakage otherwise — `asChild` type-checks but renders a nested element).
- **Parts:** a `Positioner` now sits between `Portal` and `Popup`; `Content`→`Popup`; `Overlay`→`Backdrop`; `HoverCard`→`PreviewCard`; dropdown `Menu.*` with `GroupLabel`/`SubmenuRoot`/`SubmenuTrigger`/`CheckboxItemIndicator`/`RadioItemIndicator`; select `List`/`ScrollUpArrow`/`ScrollDownArrow`/`Icon render`; `Collapsible`/`Accordion` `Content`→`Panel`.
- **State attributes:** `data-[state=open|closed]` → `data-open`/`data-closed`; `data-[state=checked|unchecked]` → `data-checked`/`data-unchecked`. `data-[disabled]` is unchanged (Base UI emits `data-disabled`, which the existing selector already matches). Animations remain `tw-animate-css` utilities, just re-gated on the new attributes (kept the `@import "tw-animate-css"`).
- **CSS variables:** `--radix-*-content-available-height` → `--available-height`, `--radix-*-trigger-width` → `--anchor-width`, `--radix-*-transform-origin` → `--transform-origin`.
- **`data-slot`:** on `useRender`-based atoms, emitted via `state: { slot: "…" }` (Base UI converts truthy state values to `data-*` attributes) rather than a `data-slot` prop, which the typed `mergeProps` arg rejects.

Component-specific API changes downstream must mirror:

- **Accordion:** Radix `type="single"|"multiple"` + `collapsible` → Base UI `multiple` (boolean) + `value`/`defaultValue`. `mobile-menu.tsx` changed `type="multiple"` → `multiple`. The trigger open state is `data-panel-open` (chevron rotation uses `[&[data-panel-open]>svg]:rotate-180`).
- **Select:** Root is generic and a provider — `Select` is now `SelectPrimitive.Root` directly (the previous `data-slot="select"` sat on a non-DOM provider and did nothing). `onValueChange` fires with `value: string | null` plus an event-details arg; `sort-select.tsx` adapts via `(value) => handleSortChange(value ?? "best-matches")`. `SelectContent` uses `alignItemWithTrigger={false}` to preserve the popper-below-trigger layout.
- **Switch:** unchanged API (`checked`/`onCheckedChange`). **Separator:** dropped the `decorative` prop (no Base UI equivalent). **Label:** now a native `<label>` (Base UI has no Label primitive) and is no longer `"use client"`. **Popover:** dropped `PopoverAnchor` (no Base UI part; had no consumers).
- **Command:** re-implemented on Base UI `Combobox` (base-nova's `command` scaffold still ships cmdk, so this is a hand-port). Export surface is preserved for `ai-elements/prompt-input.tsx`; highlighted state is `data-highlighted` (was cmdk `data-[selected=true]`).
- **Dialog focus:** Radix `onOpenAutoFocus` → Base UI `initialFocus` (a ref). `search-modal.tsx` focuses its input via `initialFocus={inputRef}`.

## Why it matters

Base UI is the successor headless library from the Radix/Floating UI/MUI teams and is now shadcn's default primitive base. This removes Radix and cmdk entirely and keeps the storefront on the current shadcn track for future component pulls. Because it swaps the primitive runtime, it is a `review` change, not a blind `adopt`.

## Apply when

- The storefront still uses the template's `components/ui/` shadcn layer over `radix-ui`/`cmdk`.
- You want to drop Radix/cmdk and move to Base UI's `render`/Positioner/`data-open` model.

## Safe to skip when

- The `ui/` layer has been heavily customized or replaced, or you have direct `radix-ui`/`cmdk` usage outside `components/ui/` that you are not ready to port.
- You depend on Radix-only behavior (e.g. Radix `asChild` on overlay triggers, Select item-aligned positioning) that you don't want to re-express in Base UI.

## Validation

- `pnpm --filter template build` and a real typecheck (`./node_modules/.bin/tsc --noEmit` — note plain `npx tsc` may resolve a decoy package) both pass; grep for `from "radix-ui"`, `from "cmdk"`, `SlotPrimitive`, `data-[state=`, and `--radix-` returns nothing in `components/`/`app/` (the only `data-state` left is self-managed on `agent-panel.tsx`/`predictive-search-results.tsx`).
- In a browser: the search modal opens/focuses/closes (Esc), the sort Select opens and updates `?sort=`, the Filters sheet slides in, the PDP lightbox opens, and `<Button asChild><Link/>>` still renders an anchor.
