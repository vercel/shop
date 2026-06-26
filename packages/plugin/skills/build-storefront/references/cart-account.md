# Cart and Account Route Architecture

## Never share personalized data

Cart and account data depend on cookies, sessions, or customer access tokens. Do not put their responses in public `"use cache"` or `"use cache: remote"` entries. Preserve auth gates and keep Customer Account API reads per customer.

Every cart mutation must call `invalidateCartCache()`. Preserve optimistic cart reconciliation so the interface responds immediately and converges on the server result.

For cart provider, bootstrap, optimistic state, nav badge, overlay, or mutation work, read `cart-provider.md` and preserve its confirmed-cart plus pending-intents model.

## Shared shell

- Keep navigation, page headings, and stable layout outside personalized boundaries.
- Reserve the cart badge, cart totals, account navigation, and form areas so session data does not shift surrounding UI.
- Keep the cart bootstrap boundary narrow. It must not block the whole root layout.
- Use explicit, useful fallbacks for full cart and account pages. Their geometry and language should match the resolved experience.

## Client boundaries

- Keep cart rows and order history server-rendered where possible.
- Isolate quantity controls, discount forms, address/profile forms, and dialogs into client leaves.
- Do not send access tokens or unnecessary customer objects to client components.
- Lazy-load closed cart overlays and other non-critical modal content when doing so does not break optimistic state synchronization.

## Mutations and transitions

- Keep the confirmed Shopify cart separate from pending client intents. Derive the displayed cart from both instead of destructively editing the confirmed cart.
- Reconcile a successful mutation response and its acknowledged intent exactly once. Never replay the same optimistic delta over the returned cart.
- Ignore stale bootstrap data and out-of-order mutation responses.
- Disable only the control affected by a mutation when concurrent actions remain safe.
- Keep stable row keys and dimensions so quantity updates do not recreate the whole list.
- Reconcile errors visibly and restore the last confirmed state.

Verify empty and populated carts, first cart creation, refresh with an existing cart cookie, mutation failure, sign-in redirect, signed-out access, and slow Customer Account API responses.
