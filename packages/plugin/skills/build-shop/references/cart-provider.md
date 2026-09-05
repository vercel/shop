# Cart Provider and Bootstrap Contract

Use this contract when changing cart bootstrap, badges, overlays, cart pages, forms, or assistant mutations. Hydrogen owns cart state and reconciliation; the template adapts it to Next.js and supplies presentation.

## Reference implementation

- Provider: `apps/template/components/cart/context.tsx`
- Server seed and handler extensions: `apps/template/lib/cart/server.ts`
- Handler-derived types and typed suspense hook: `apps/template/lib/cart/{index,client}.ts`
- Form bindings: `apps/template/components/cart/{line-form,discount-form}.tsx`
- Root bootstrap: `apps/template/app/layout.tsx`
- Cart page: `apps/template/app/cart/page.tsx`, `apps/template/components/cart-page/`
- Assistant synchronization: `apps/template/components/agent/cart-bridge.tsx`
- HTTP and cookie boundary: `apps/template/proxy.ts`
- Docs: [cart anatomy](https://vercel.shop/docs/anatomy/cart)

## Ownership

Use Hydrogen's `CartProvider`, `useCart`, `useCartForm`, and cart actions for cart state, pending mutations, errors, and reconciliation. Do not add a parallel reducer, custom confirmed-cart store, or server-to-client hydration effect. The template's drawer context owns only overlay visibility.

Cart types derive from `CartDataFromHandlers<typeof cartHandlers>` in `lib/cart/index.ts`, including the additive cart fragment. They are not transformed into `lib/types.ts` models. Generic `ui/` primitives still receive primitive presentation props.

Hydrogen owns the base cart operations. The template adds selections needed for prices, discounts, and analytics through the custom fragment in `lib/cart/server.ts`. Validate extensions with the template's codegen command rather than guessing fields or editing SDK queries.

## Bootstrap and live reads

1. Start the request-memoized `seedCartData()` in the root layout and pass its promise as `CartProvider` initial data without awaiting it in the shell.
2. Resolve cart-dependent UI under narrow Suspense boundaries with the typed `useSuspenseCart` hook. Keep navigation and static headings outside those boundaries.
3. Read the provider's live cart in cart-page and overlay leaves so empty/populated transitions follow mutations without a route refresh.
4. Preserve Hydrogen's bootstrap-versus-mutation ordering. Do not publish a second server seed into an initialized provider.

Cart reads are memoized only within a request, never stored in the Next.js public data cache. Cart mutations do not invalidate public cache tags.

## Mutations

Browser forms use Hydrogen bindings and the `/api/cart` handlers registered by the proxy. The handler response commits cart cookies. The remaining checkout server action is not an alternative add/update/remove transport.

Assistant tools invoke the same cart handlers through the server adapter without an internal HTTP round trip. The chat response owns first-cart cookie persistence before streaming. Tool results expose a mutation signal rather than full cart payloads; the client bridge refreshes Hydrogen's cart after new successful mutations and must not replay restored conversation history.

Keep Shopify authoritative for inventory, discounts, buyer identity, delivery state, totals, warnings, and checkout URL. Use SDK pending/error state rather than locally reconstructing a confirmed cart. Preserve gift-card attributes, selling-plan identity, and bundle line restrictions. Keep checkout unavailable while cart changes are pending.

## Acceptance checks

These are behavioral requirements for the integration, not instructions to reimplement Hydrogen internals:

1. Empty cart, add one: `0 → 1`, never `0 → 1 → 2 → 1`.
2. Existing quantity one, add one: `1 → 2` with no reversion.
3. Add during delayed bootstrap; the late seed must not overwrite the mutation.
4. Rapid same-variant adds converge on the requested quantity.
5. Repeated line changes and out-of-order responses do not restore older intent.
6. Changes to different lines preserve both outcomes.
7. Failed add, update, remove, and discount operations restore confirmed state and show the relevant error.
8. First-cart creation persists across navigation and reload through the browser cookie.
9. Cart page, badge, overlay, and assistant converge on the same state, including empty/populated transitions.
10. Gift recipients, bundle relationships, discounts, totals, warnings, and checkout URL survive reconciliation.
11. Sign-in, refresh, and logout keep buyer identity consistent with the customer session.

Run focused automated checks and browser/live-store checks appropriate to the change. Report unavailable live flows explicitly; mocks and typechecks are not end-to-end proof.
