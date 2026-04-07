# Recipe: Cart Server Actions

> Every cart mutation goes through server actions that call the commerce provider and invalidate cache tags.

## When to read this

- Adding a new cart operation (gift wrapping, notes, discount codes)
- Debugging stale cart data after mutations
- Understanding why `updateTag` is required after every mutation

## Key files

| File | Role |
|------|------|
| `components/cart/actions.ts` | Primary cart server actions (remove, update, add, checkout, buy now) |
| `components/product/actions.ts` | `addToCartAction` used by the optimistic cart context via `FormData` |
| `lib/commerce/operations/cart.ts` | Commerce provider cart operations |
| `lib/constants.ts` | `TAGS` constant (`{ collections, products, cart }`) |

## How it works

### Server action pattern

Every cart server action follows this pattern:

```tsx
"use server";

import { invalidateCartCache } from "@/lib/cart-cache";

export async function someCartAction(...): Promise<CartActionResult> {
  // 1. Validate inputs
  if (!valid) return { success: false, error: "..." };

  // 2. Call commerce operation
  const result = await commerceOperation(...);

  // 3. Invalidate cache (REQUIRED)
  invalidateCartCache();

  // 4. Fetch fresh cart and return
  const updatedCart = await getCart();
  return { success: true, cart: updatedCart };
}
```

### Two addToCart actions

There are two separate `addToCartAction` functions serving different purposes:

1. **`components/product/actions.ts`** — Uses `FormData` interface for `useActionState`. Called by the optimistic cart context. Returns `AddToCartState` with `{ error, success, cart }`.

2. **`components/cart/actions.ts`** — Uses direct parameters `(merchandiseId, quantity)`. Also handles shipping address seeding via `after()`. Returns `CartActionResult`.

Both call the same `addToCart` operation and both invalidate the same tags.

### CartActionResult type

All cart actions in `components/cart/actions.ts` return:

```tsx
type CartActionResult = {
  success: boolean;
  error?: string;
  cart?: Cart;
};
```

The `cart` field contains the full updated cart from the commerce provider, which the context uses to replace optimistic state.

### Cache invalidation

Every cart mutation must invalidate the cart cache by calling `invalidateCartCache()` from `@/lib/cart-cache`. This invalidates the `TAGS.cart` tag (`"cart"`, defined in `lib/constants.ts`).

### Shipping address seeding

The `addToCartAction` in `components/cart/actions.ts` uses `after()` to seed shipping addresses from geo headers:

```tsx
if (!result.shippingCost) {
  after(async () => {
    const { currentAddress } = await getShippingAddressInfo();
    if (currentAddress?.countryCode) {
      // Add or update delivery address on cart
      updateTag(TAGS.cart);
    }
  });
}
```

This runs after the response so add-to-cart stays fast. The shipping estimate shows on the next render.

### Buy now flow

`buyNowAction` adds to cart and returns the checkout URL in one action:

1. `addToCart` and `getSession` run in parallel (they're independent)
2. If authenticated, `linkCartToCustomer` ensures the provider recognizes the customer at checkout
3. Returns `{ checkoutUrl }` for client-side redirect

### Checkout preparation

`prepareCheckoutAction` links the cart to the authenticated customer before redirecting to checkout. Falls back gracefully if not authenticated.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Every cart mutation MUST call `invalidateCartCache()` — omitting it causes stale cache
- [ ] GUARDRAIL: Cart actions must be marked `"use server"` — they're called from client components via the cart context
- [ ] GUARDRAIL: Always return `CartActionResult` with `success: boolean` — the optimistic cart context uses this to decide whether to keep optimistic state or roll back
- [ ] GUARDRAIL: Never call `updateTag` before the commerce mutation succeeds — premature invalidation causes a race where stale data gets re-cached

## Common modifications

### Adding a discount code action

1. Add `applyDiscountCode` operation in `lib/commerce/operations/cart.ts`
2. Create server action in `components/cart/actions.ts`:
   ```tsx
   export async function applyDiscountAction(code: string): Promise<CartActionResult> {
     const result = await applyDiscountCode(code);
     invalidateCartCache();
     const updatedCart = await getCart();
     return { success: true, cart: updatedCart };
   }
   ```
3. Call from client component, handle the result to update context

### Debugging stale cart data

If the cart shows stale data after mutations:
1. Verify the action calls `invalidateCartCache()`
2. Check that `updateTag` is called AFTER the commerce mutation, not before
3. Verify the action returns the fresh cart (`await getCart()`) in the result

## See also

- [Optimistic Cart](./optimistic-cart.md) — How the client context consumes these actions
- [Caching Strategy](../architecture/caching-strategy.md) — How `updateTag` triggers revalidation
