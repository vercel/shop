---
title: Cart mutations — use normalized mutation response
changeKey: cart-mutations-use-response
introducedOn: 2026-06-25
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/cart/action.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/agent/tools/update-cart-item.ts
  - apps/docs/content/docs/anatomy/cart.mdx
---

## Summary

Add, update, and remove server actions now use the normalized cart returned by their Shopify GraphQL mutation instead of issuing a follow-up `getCart()` query. Quantity updates also stop reading the cart before the mutation: `CartLineUpdateInput` only needs the cart line ID and quantity, so `updateCart()` and the shopping agent's update tool no longer accept an unused merchandise ID.

## Why it matters

- Add and remove actions use one Shopify request instead of two.
- Quantity updates use one Shopify request instead of three.
- The UI receives the same normalized `Cart` shape directly from the authoritative mutation response.

## Apply when

- Cart actions call `getCart()` after `addToCart()`, `updateCart()`, or `removeFromCart()`.
- Quantity updates read the current cart only to recover a merchandise ID before calling `cartLinesUpdate`.

## Safe to skip when

- Custom mutation documents do not select the full cart fields required by the storefront.
- A custom pre-mutation read performs business validation beyond recovering the line's merchandise ID.

## Validation

1. Run `pnpm --filter template lint` and `pnpm --filter template build`.
2. Add, update, and remove a cart line; confirm each action returns the updated cart and issues only its mutation request to Shopify.
