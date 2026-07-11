---
title: Cart reads — request-deduped getCart and a single client seeder
changeKey: cart-request-dedupe-single-seeder
introducedOn: 2026-07-10
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/agent/tools/get-cart.ts
  - apps/template/components/nav/cart.tsx
  - apps/template/components/nav/cart-client.tsx
  - apps/template/components/cart/context.tsx
  - apps/template/components/cart/context-sync.tsx
---

## Summary

`getCart()` is now wrapped in `React.cache` and takes no arguments — it resolves the cart-id cookie internally, so every server boundary in a single render (the nav cart icon and the cart page) shares one Shopify fetch instead of issuing duplicate queries. `getCartById()` remains available for the streaming agent, which may create a cart before its response sets the cart-id cookie. On the client, the two duplicated effect-based seeders (in `cart-client.tsx` and `context-sync.tsx`) collapse into one shared `useSeedCart(initialCart)` hook exported from the cart provider.

## Why it matters

- `/cart` previously called `getCart()` twice per request (nav icon + page); dedupe makes it one request.
- The "seed root provider from a server-fetched cart" logic lived in two places with identical `if (cart === null) setCart(...)` effects. Consolidating removes the drift risk and gives one source of truth.
- Aligns the cart read path with the "one cached promise, shared across boundaries" model without forcing the static shell dynamic (the root provider still mounts with `initialCart={null}`; seeding happens inside Suspense boundaries that already read cookies).

## Apply when

- `getCart(cartId?)` accepts an optional id and is called with different argument shapes across boundaries (`getCart(cartId)` in the nav vs `getCart()` on the page), which defeats per-request dedupe.
- `CartIconClient` and `CartContextSync` each carry their own `useEffect` that seeds the provider from a server cart.

## Safe to skip when

- A caller genuinely needs to fetch an arbitrary cart by id that is not yet available from the request cookie. Keep that path explicit with `getCartById()` rather than adding an optional id back to the request-deduped `getCart()` API.

## Validation

1. Run `pnpm --filter template lint`.
2. Load `/cart` and confirm only one `getCart` Shopify request is issued for the render.
3. Add, update, and remove a cart line and confirm the nav badge, overlay, and cart page stay in sync.
