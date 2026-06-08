---
title: Cart discount codes, applied gift cards (read-side), and mutation warnings
changeKey: cart-discount-codes-and-warnings
introducedOn: 2026-06-04
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/transforms/cart.ts
  - apps/template/lib/shopify/errors.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/cart/action.ts
  - apps/template/lib/types.ts
  - apps/template/components/cart/context.tsx
  - apps/template/components/cart/warnings.tsx
  - apps/template/components/cart/discount-form.tsx
  - apps/template/components/cart/overlay-content.tsx
  - apps/template/components/cart/overlay-summary.tsx
  - apps/template/components/cart-page/summary.tsx
  - apps/template/app/cart/page.tsx
  - apps/template/lib/i18n/messages/en.json
---

## Summary

Expands the cart domain to cover discount codes, discount allocations, applied gift cards (read-only), and mutation warnings — narrowing the Hydrogen-parity gap in `CART_FRAGMENT`.

What ships:

- **Data coverage.** `CART_FRAGMENT` now queries `discountCodes`, `discountAllocations` (with inline fragments for `CartCodeDiscountAllocation`, `CartAutomaticDiscountAllocation`, `CartCustomDiscountAllocation`), `appliedGiftCards`, and per-line `discountAllocations`. Domain types (`DiscountCode`, `DiscountAllocation`, `AppliedGiftCard`, `CartWarning`) live in `lib/types.ts`.
- **Mutation warnings.** Every cart mutation now queries the `warnings { code message target }` field. `unwrapCartMutation` returns `{ cart, warnings }` instead of just `cart`; all cart operations return `{ cart, warnings }`. `CartActionResult` carries `warnings?`.
- **Warnings UI.** The cart context tracks `lastWarnings` and exposes `clearWarnings` + `setWarnings`. Add/update/remove mutations seed it. New `<CartWarnings />` banner renders inside the overlay scrollable area and on the cart page, with a dismiss button.
- **Discount code mutation + UI.** New `cartDiscountCodesUpdate` operation, `applyDiscountCodeAction`/`removeDiscountCodeAction` server actions, and a `<DiscountForm />` rendered in `OverlaySummary` and the cart page `Summary` (input + apply, chips with remove, "Discount: −$X.XX" row when allocations exist). Codes marked `applicable: false` render struck-through with a "Not applicable" tag.
- **No optimistic state for discounts.** Discount rules can cascade across lines in ways the client can't predict (BOGO, % off specific products, automatic stacking). The form uses `useTransition` for pending state and replaces the cart wholesale on the server response.

## Why it matters

- Discounts and promo codes are the most-asked-for cart feature gap vs. Shopify's hosted checkout and Hydrogen.
- Mutation warnings (e.g. `MERCHANDISE_OUT_OF_STOCK`) used to be silently dropped — Shopify auto-removes out-of-stock lines and the user got no feedback in this template. Now they see a banner explaining what happened.
- Pulling `appliedGiftCards` read-side means a gift card applied elsewhere (admin, recovered cart, future apply UI) renders correctly in the storefront cart immediately. No apply/remove UI ships in this change.

## Apply when

- The storefront uses the default cart UI (overlay + dedicated `/cart` page) shipped with the template.
- You want users to redeem Shopify discount codes from the storefront instead of only in checkout.

## Safe to skip when

- The storefront has replaced the cart UI entirely and already has its own discount/promo wiring.
- You only sell with automatic discounts (no codes) — in that case keep the data coverage but skip the form by not slotting `<DiscountForm />` into your summary.

## Tradeoff

`unwrapCartMutation`'s return shape changed from `T` (the cart) to `{ cart: T; warnings: CartWarning[] }`. Every call site that destructures needs `{ cart, warnings }` instead of a bare assignment. In this template the only callers are `lib/shopify/operations/cart.ts` itself plus four agent tools and one chat-route call — all updated in this change. Downstream forks that vendored those callers need the same adjustment.

The discount form has no optimistic state; users see a brief pending spinner while the server recomputes totals. This is intentional given how unpredictable discount logic is.

## Out of scope (follow-up)

- Gift card apply/remove UI (`cartGiftCardCodesUpdate`).
- Per-line discount allocation labels in the cart line itself (data is queried but not rendered).
- Shareable `/discount/:code` and `/cart/:lines` link routes.
- `ComponentizableCartLine` bundle parent/child rendering.

## Validation

1. `pnpm --filter template build` succeeds; no type errors from the `unwrapCartMutation` return-shape change.
2. With the dev server running:
   - Apply a real Shopify discount code from the dev store → chip appears, "Discount: −$X.XX" row renders, totals update.
   - Apply an invalid/expired code → inline error message; no chip.
   - Apply a valid-but-not-applicable code → chip renders muted + struck-through with a "Not applicable" tag.
   - Remove a code via × → totals revert.
   - Reduce a product's inventory to 0 in admin, then mutate the cart → `MERCHANDISE_OUT_OF_STOCK` warning surfaces in the banner.
3. Checkout works with a discount applied — `cart.checkoutUrl` carries the discount through to Shopify checkout.
