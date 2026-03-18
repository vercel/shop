# Recipe: Optimistic Cart System

> The cart uses optimistic updates with debouncing and request versioning to feel instant while staying consistent with the server.

## When to read this

- Modifying cart quantity update or remove behavior
- Debugging cart UI showing stale or doubled quantities
- Adding new cart line operations (e.g., gift wrapping, bundles)
- Touching `components/cart/context.tsx` or `components/cart/actions.ts`

## Key files

| File | Role |
|------|------|
| `components/cart/context.tsx` | Cart context provider — optimistic state, debouncing, request versioning |
| `components/cart/constants.ts` | `DEBOUNCE_MS = 400` timing constant |
| `components/cart/actions.ts` | Server actions for cart mutations (add, update, remove, checkout) |
| `components/product/actions.ts` | `addToCartAction` — server action called from product pages |
| `components/cart/context-sync.tsx` | Syncs server-rendered cart into client context on first load |

## How it works

### Architecture overview

The cart has three layers:

1. **Server actions** (`actions.ts`) — Call Shopify API, invalidate cache tags, return updated cart
2. **Context provider** (`context.tsx`) — Manages optimistic state, debouncing, request versioning
3. **Components** — Read from context via `useCart()`, call `addToCartOptimistic` or `updateItemOptimistic`

### Two cart states

The context exposes two cart objects:

```
cart           → The "real" cart from Shopify, with pending line operations overlaid
cartWithPending → cart + pending add-to-cart items that haven't been sent yet
```

Components that show line items use `cart`. Components that show the total badge count use `cartWithPending`.

### Optimistic line IDs

When a user adds to cart before the server responds, the context creates temporary cart lines with IDs prefixed `optimistic-`:

```tsx
// context.tsx:301
id: `optimistic-${variantId}`,
```

These optimistic lines are merged into existing lines by matching on `merchandise.id`. Once the server responds, the real cart replaces optimistic state.

### Debounce strategy: add-to-cart

Add-to-cart uses **trailing-edge debounce** (400ms). Rapid clicks accumulate quantities, then fire once:

```
Click +1 → pending=1 (timer starts)
Click +1 → pending=2 (timer resets)
Click +1 → pending=3 (timer resets)
... 400ms passes ...
→ Single request: addToCart(quantity=3)
```

### Debounce strategy: quantity update

Quantity updates use **leading-edge + trailing-edge debounce**:

```
Click +1 → fires immediately (leading edge)
Click +1 → queued (timer starts)
Click +1 → queued (timer resets)
... 400ms passes ...
→ Final request with latest quantity (trailing edge)
```

The first click gets instant server confirmation. Subsequent clicks within 400ms batch into one final request.

### Debounce strategy: remove

Remove (quantity === 0) **bypasses debounce entirely** — fires immediately. This is intentional: users expect instant feedback when removing items, and there's no batching benefit.

### Request versioning

Each line has a request counter (`latestLineRequestIdRef`). When a new request fires for a line, the counter increments. Stale responses (where the response's request ID doesn't match the current counter) are silently ignored:

```tsx
// context.tsx:428
if (latestLineRequestIdRef.current.get(lineId) !== requestId) {
  endTracking();
  return; // Stale response — ignore
}
```

### Computation order

The display cart is computed in two steps, in this exact order:

```tsx
// context.tsx:291-293
const displayCart = applyPendingLineOperations(cart, lineOpsRef.current);
const cartWithPending = computeCartWithPending(displayCart, pendingQuantity, pendingLines);
```

1. `applyPendingLineOperations` — Overlays in-progress quantity changes onto existing lines
2. `computeCartWithPending` — Merges new add-to-cart items that haven't been sent yet

### Error rollback

If a server action fails, the context restores the `originalCart` snapshot captured when the operation started:

```tsx
// context.tsx:442-451
} else if (originalCart) {
  setCartInternal(originalCart);
}
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Never modify `lineOpsRef` or `latestLineRequestIdRef` outside their owning functions in `context.tsx` — these refs coordinate concurrent requests and races
- [ ] GUARDRAIL: The `optimistic-` prefix on line IDs (e.g., `optimistic-${variantId}`) distinguishes pending from confirmed lines — never change this prefix or remove it
- [ ] GUARDRAIL: `computeCartWithPending` must run AFTER `applyPendingLineOperations` — reversing the order causes quantity doubling because pending ops get applied twice
- [ ] GUARDRAIL: `DEBOUNCE_MS = 400` is a tested value — values below 200 cause race conditions with Shopify API, values above 800 feel sluggish
- [ ] GUARDRAIL: `removeFromCartAction` (quantity === 0) bypasses debounce and fires immediately — never add debounce to removes
- [ ] GUARDRAIL: Every cart server action must call `invalidateCartCache()` after mutation — missing it causes stale cache

## Common modifications

### Adding a new cart operation (e.g., gift wrapping)

1. Add the Shopify GraphQL mutation in `lib/shopify/operations/cart.ts`
2. Create a server action in `components/cart/actions.ts` that calls the operation and invalidates tags:
   ```tsx
   invalidateCartCache();
   ```
3. If the operation needs optimistic UI, add state tracking in `context.tsx` following the pattern of `updateItemOptimistic`
4. Expose the new function through the `CartContextType` interface

### Changing debounce timing

Edit `components/cart/constants.ts`. The value applies to both add-to-cart and quantity updates. Test with rapid clicking — the trailing-edge request should fire exactly once after the delay.

## See also

- [Cart Actions](./cart-actions.md) — Server action patterns and cache invalidation
- [Caching Strategy](../architecture/caching-strategy.md) — How `updateTag` triggers revalidation
