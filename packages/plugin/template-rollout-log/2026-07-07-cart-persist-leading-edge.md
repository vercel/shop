---
title: Cart — leading-edge add + single-call cart creation so a quick reload after adding keeps the item
changeKey: cart-persist-leading-edge
introducedOn: 2026-07-07
changeType: fix
defaultAction: adopt
appliesTo:
  - apps/template/components/cart/context.tsx
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/shopify/fetch.ts
paths:
  - apps/template/components/cart/context.tsx
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/shopify/fetch.ts
relatedSkills:
  - /vercel-shop:build-shop
---

## Summary

Adding the first item to an empty cart, then reloading the page a beat later, could land on an empty cart. The cart id lives in the `shopify_cartId` HTTP-only cookie, which a server action only commits when it finishes — and two things widened the window between the click and that commit:

1. **Add-to-cart used a trailing-edge 400ms debounce.** The header count updated optimistically at t≈0, but `addToCartAction` did not fire until 400ms after the click. A reload inside that window never even sent the request.
2. **The first add did two sequential Shopify round-trips** — `cartCreate` (empty) then `cartLinesAdd` — so the cookie only committed after both completed.

Both are now addressed:

- **Leading-edge add** (`components/cart/context.tsx`): the first add fires immediately (mirroring the existing `updateItemOptimistic` leading-edge pattern); rapid follow-up clicks still coalesce into a single trailing flush. The flush body is extracted to `flushPendingAddToCart`.
- **Single-call creation** (`lib/shopify/operations/cart.ts`, `lib/shopify/fetch.ts`): when no cart exists, `addToCart` now calls `createCart(locale, lines)`, which creates the cart *with* its lines via one `cartCreate` mutation. `createCartCore`/`createCartWithoutCookie`/`createCart` take an optional `lines` argument; existing no-lines callers (e.g. the eve agent tool) are unchanged. `CartInput.lines` is validated against the codegen'd Storefront schema.

This is browser-agnostic — the same race reproduces in Chrome — but surfaced during Safari testing. Measured on local dev, the add-to-cart server action dropped from ~1520ms (two calls) to ~910ms (one call), on top of removing the 400ms debounce delay. `invalidateCartCache()` still runs on every mutation (the first-add path routes through `createCartWithoutCookie`).

## Why it matters

Downstream storefronts get a materially smaller window in which an add-then-reload drops the cart, and one fewer Shopify round-trip on the first add.

## Apply when

- The storefront uses the template's `components/cart/context.tsx` optimistic cart and `lib/shopify/operations/cart.ts` add/create flow.

## Adopt with changes

- Storefronts that customized the add-to-cart debounce or the `createCart*` signatures should port those changes onto the new leading-edge flush and the optional `lines` parameter.

## Safe to skip when

- The storefront replaced the cart context or cart operations with a different implementation (e.g. Hydrogen's cart handlers).

## Validation

1. On a product page with an empty cart, add an item and reload ~1-2s later; the item remains in the cart.
2. With `DEBUG_SHOPIFY=true`, a first add logs a single `[shopify] cartCreate` with no following `cartLinesAdd`.
3. Rapid repeated add clicks still coalesce (no one-request-per-click storm) while the first request fires immediately.
