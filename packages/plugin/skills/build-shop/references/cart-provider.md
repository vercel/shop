# Cart Provider and Bootstrap Contract

Use this contract when creating or changing global cart context, server bootstrap, nav badges, cart overlays, cart pages, or optimistic mutations. Preserve the behavior, but adapt names and component composition to the storefront.

## Reference implementation

- Docs: [cart anatomy](https://vercel.shop/docs/anatomy/cart)
- Provider and bootstrap bridge: `apps/template/components/cart/context.tsx`, `apps/template/components/cart/context-sync.tsx`
- Nav badge and overlay: `apps/template/components/nav/cart.tsx`, `apps/template/components/nav/cart-client.tsx`, `apps/template/components/cart/overlay.tsx`, `apps/template/components/cart/overlay-content.tsx`
- Cart page: `apps/template/app/cart/page.tsx`, `apps/template/components/cart-page/`
- Server state and mutations: `apps/template/lib/cart/server.ts`, `apps/template/lib/cart/action.ts`, `apps/template/lib/cart/index.ts`, `apps/template/lib/shopify/operations/cart.ts`
- Public source fallback: [cart provider source](https://github.com/vercel/shop/tree/main/apps/template/components/cart), [cart data source](https://github.com/vercel/shop/tree/main/apps/template/lib/cart), [template source](https://github.com/vercel/shop/tree/main/apps/template)

## State ownership

Keep one authoritative confirmed cart and model pending user intent separately:

```text
displayed cart = project(confirmed Shopify cart, pending adds, pending line operations)
```

- `confirmedCart` is `null` until bootstrap or a successful mutation supplies a Shopify cart.
- Pending adds are keyed by a complete purchasable-line identity: merchandise ID plus selling plan and line attributes when present.
- Pending line operations are keyed by Shopify cart line ID and store an absolute target quantity. Quantity `0` means removal.
- Request versions are tracked per pending key so an older response cannot replace newer intent.
- UI-only state such as overlay visibility, warnings, and affected-control pending status stays outside the cart data.

Do not model an add as a relative optimistic reducer over a base cart that can change while the action is pending. React may replay that reducer over the new base, briefly double-applying the add. Do not make `hydrateCart` and mutation responses unrestricted competing writers.

## Bootstrap without blocking the shell

1. Mount the provider synchronously with `confirmedCart = null` so navigation and the page shell can render.
2. Read the cookie-backed cart on the server inside the smallest useful Suspense boundary, normally the cart badge or a dedicated bootstrap component. Do not block the whole root layout.
3. Bridge the resolved cart into the provider once. Accept bootstrap only while the provider is uninitialized and no client mutation has started.
4. Treat `null` as a valid empty-cart result. Distinguish “bootstrap not resolved” with a separate status when the UI needs to know.
5. Never let late bootstrap, route refresh, or server hydration overwrite a newer mutation response or pending client intent.

The cart page may render server-fetched cart data immediately, but its client bridge follows the same rule: seed an uninitialized provider; never downgrade a newer confirmed cart.

## Derive the displayed cart

Project pending intent over `confirmedCart` without mutating it:

1. Apply pending adds. Merge only when the complete purchasable-line identity matches; otherwise render a temporary stable line.
2. Apply absolute quantity targets and removals by canonical line ID.
3. Derive safe presentation values such as visible quantity and a provisional line amount.
4. Keep Shopify authoritative for discounts, warnings, buyer identity, delivery state, currency, subtotal, total, and checkout URL. Never publish a locally reconstructed cart as confirmed state.

Use a memoized pure projection, a reducer over explicit pending intent, or an equivalent external-store selector. `useOptimistic` is allowed only when the same intent cannot be replayed over the canonical response. The confirmed-cart plus pending-intents model is the default.

## Add protocol

1. Enqueue the quantity under the purchasable-line key and render it immediately. Open the overlay when the interaction calls for it.
2. Accumulate or debounce rapid adds for the same key when that reduces network work without delaying feedback.
3. Send the accumulated quantity to a server action. The action creates the cart when necessary, persists the cart ID through the server cookie path, calls `invalidateCartCache()`, and returns the updated Shopify cart plus warnings or errors.
4. On success, replace `confirmedCart` with that returned cart and retire only the quantity acknowledged by the response. Preserve intent queued while the request was in flight.
5. On failure, retire the failed intent, reveal the last confirmed cart, and surface the error near the initiating action or cart.

## Quantity and removal protocol

1. Store the requested absolute quantity and a snapshot of the last confirmed cart.
2. Assign a monotonically increasing request version for that line.
3. Optimistically project the absolute target. A repeated click replaces the target instead of stacking ambiguous deltas.
4. Commit a response only if its version is still latest for the line.
5. If newer intent arrived during the request, keep projecting it and send the final target through the chosen leading-edge or trailing-edge debounce policy.
6. Removal sets target quantity to `0`, cancels timers, and invalidates older quantity responses for that line.
7. On the latest request's failure, restore the confirmed snapshot unless newer intent already superseded it.

Mutations for discounts, notes, buyer identity, or other cart fields also return a canonical cart. Committing them must preserve unrelated pending line intent.

## Concurrency invariants

- A successful response is applied at most once.
- A pending intent is projected at most once.
- An acknowledged intent is removed exactly once.
- A stale response or stale hydration never moves the cart backward.
- Pending work queued during a request survives that request's completion.
- Pending state is scoped to the affected line or action; one mutation does not freeze unrelated controls unless Shopify ordering requires serialization.

## Focused verification

Exercise these flows in the available development environment:

1. Empty cart, add one: `0 → 1`, never `0 → 1 → 2 → 1`.
2. Existing quantity one, add one: `1 → 2` with no reversion.
3. Add while bootstrap is unresolved; late bootstrap must not overwrite the new cart.
4. Rapidly add the same variant and confirm the final quantity and request batching.
5. Change one line repeatedly and deliver responses out of order; only the latest target wins.
6. Mutate different lines concurrently and preserve both outcomes.
7. Fail add, update, and remove mutations; restore confirmed state and show the error.
8. Refresh after first cart creation and confirm the cookie-backed cart bootstraps once.
9. Confirm discounts, warnings, currency, totals, line attributes, selling plans, and checkout URL converge to the Shopify response.

Do not require a production build or field-performance data for routine cart-provider verification.
