# Hydrogen cart integration — design notes

Working document for the `@shopify/hydrogen` preview evaluation (PR #396). The
client and money-formatting swaps are merged into this branch; this doc captures
the design for the next step — adopting Hydrogen's cart store — plus the
requirements we've raised with the Hydrogen team and why. Last updated
2026-07-06, while Shopify's promise-ingestion release is unreleased (expected
week of 2026-07-06).

## The goal (the "X problem")

In streaming SSR, cart-dependent leaves — nav badge, drawer contents, cart
page — must render **with real cart data in the first paint**, streamed, without
blocking the rest of the page. Provider children render immediately; only
components that read cart data wait, each inside its own Suspense boundary.

On initial load there should be **no client-visible loading state**: the server
is already fetching the cart (`getCart()` in the layout, not awaited), so the
resolved badge should stream into the initial HTML. "Show a spinner while the
cart loads" is the failure mode, not the feature.

## Why the current template cart can't just adopt Hydrogen's model

The template cart is server-owned: server actions mutate, `updateTag("cart")`
invalidates, server components render cart UI from a cookie-scoped `getCart()`.
Hydrogen's published preview cart is client-owned: the store fetches
`/api/cart` after hydration, the cookie is client-readable (not `httpOnly`),
and optimistic state is fused to a form-POST transport
(`useCartForm` → `store.handleFormSubmit` → POST `/api/cart` → reconcile).

Adopting it wholesale would regress:

- **First paint** — post-hydration fetch means the badge always pops in
  (HTML → JS → hydrate → fetch → render waterfall).
- **Cookie semantics** — `httpOnly`/`SameSite=Strict` → client-readable/`Lax`,
  plus a cookie-name migration that drops existing carts.
- **Mutation behavior** — the server actions carry template-specific logic
  (discount apply/revert on `applicable: false`, buyer-identity locale sync,
  cart↔customer linking, quantity validation) with no home in their fixed
  action vocabulary.
- **Cache coherence** — `/api/cart` mutations bypass Next's cache tags; any
  server-rendered cart data goes stale.

## The hybrid design

Keep the store for **state**; keep Next for **transport**.

```
                    server                          client
                    ──────                          ──────
layout:  const cart = getCart()  ──RSC promise──▶  <CartProvider cart={cart}>
                                                    store ingests promise
mutations: server actions ──result.cart──────────▶ store.receive(cart)
revalidation: updateTag("cart") → new promise ───▶ store.receive (guarded)
```

### Reads: suspend at the leaves, never at the provider

The server layout starts `getCart()` without awaiting and passes the promise to
the provider. The store ingests it. Leaves that render cart _data_ gate on a
thenable that settles when the store has hydrated:

```tsx
function useCartData<S>(selector: (s: CartState) => S): S {
  const store = useCartStore(); // context; stable per provider instance
  use(getReady(store)); // suspends this leaf only; no-op once settled
  return useCart(selector); // uSES; selector runs post-gate only
}
```

- `use()` before the selector is deliberate: selectors never execute against
  the unhydrated store, so `s.data` is non-nullable by convention. A selector
  above the gate would run on pre-hydration renders and a non-null-safe one
  (`s.data.lines`) throws a TypeError that _beats_ the suspension — error
  boundary instead of fallback.
- Components that render cart _status_ (mutation spinner, disabled checkout
  button) use the plain ungated `useCart` and read `loading`/`pending`/`error`
  — those fields exist in every state shape, and these components must render
  before/during resolution by definition.
- `use()` (not `throw promise`): thrown promises are unsupported legacy;
  `use()` gives settled-thenable synchronous pass-through, rejection→boundary
  integration, transition semantics, and replay optimizations for free.

### Why suspense and not the store's `loading` boolean

`loading` is the right API for frameworks without suspense semantics, and stays.
It cannot deliver the initial data well in streaming SSR:

1. `useSyncExternalStore` renders one snapshot per SSR pass — store updates
   never re-render an in-progress server render, so the HTML always contains
   the loading state regardless of fetch timing.
2. Hydration must replay that same snapshot (mismatch avoidance), so the first
   client commit is the skeleton _even if the data already arrived_.
3. The flip to data is a synchronous, non-interruptible external-store flush of
   every subscriber (badge, drawer, lines, summary, checkout) — uSES updates
   can't be time-sliced or downgraded to transitions.

Net: two commits minimum, badge pop-in, CLS, fetch off the streaming path. With
the gate, the leaf suspends _during SSR_, the promise resolves server-side, the
resolved badge streams into first paint, and the client hydrates once directly
into final state. (uSES is still fine _through_ a suspension retry — the retry
re-executes the component and re-reads the snapshot. The limitation is
narrowly: a subscription event can't re-render an in-progress SSR pass.)

### The `ready` thenable contract

Whether Shopify ships `store.ready` or we polyfill it, the contract is:

1. **Stable identity** — `use()` keys on the object; a fresh thenable per
   render/snapshot re-suspends forever. Belongs on the _store_ (structurally
   stable), not in state (must be threaded by reference through every immutable
   state copy — one refactor away from breakage).
2. **Settles only after the internal state write** — the first unsuspended
   render immediately reads the uSES snapshot; if the thenable wins the
   microtask race the snapshot still says `loading: true` and the skeleton
   double-commit is back, narrower and flakier.
3. **Never rejects** — rejection is an all-consumer broadcast to error
   boundaries; cart consumers have incompatible failure policies (badge should
   degrade silently; cart page must NOT pretend empty — that's lying to the
   user). Failures land in `state.error` + empty data; consumers choose.
   A consumer that wants throw semantics can `if (s.error) throw s.error`; the
   reverse is not buildable.
4. **Settles exactly once** — later data adoption reconciles in the background
   and never re-suspends settled leaves.

Userland polyfill (works today against `subscribe` — makes `ready` an
ergonomics ask, not a blocker; settle-after-write is guaranteed by construction
because it resolves _from_ the state-change notification):

```ts
const readyCache = new WeakMap<CartStore, Promise<void>>();

function getReady(store: CartStore): Promise<void> {
  let ready = readyCache.get(store);
  if (!ready) {
    ready = new Promise<void>((resolve) => {
      if (!store.getState().loading) return resolve(); // late mount
      const unsubscribe = store.subscribe(() => {
        if (!store.getState().loading) {
          unsubscribe();
          resolve();
        }
      });
    });
    readyCache.set(store, ready);
  }
  return ready;
}
```

Caveats: (a) this hangs forever if `loading` never flips `false` on a failed
fetch — see hard requirement 2 below; (b) a leaf mounting after resolution
suspends one microtask on the uninstrumented promise — eliminate by setting
`ready.status = "fulfilled"` on resolve.

### Error handling

`getCart()` has three outcomes; only one is an error:

- resolves with a cart → normal;
- resolves `null` (no cookie / expired) → **normal empty state**, not an error;
- rejects (`StorefrontApiError` / `StorefrontTimeoutError`) → error.

Make the promise structurally unable to reject at the source (same idiom as
today's `withFallback`, upgraded to carry the error bit):

```tsx
// app/layout.tsx (server)
const cart = getCart().then(
  (cart) => ({ cart, error: false }),
  () => ({ cart: null, error: true }),
);
```

Consumers: badge/checkout need no check (`null` renders as no badge — correct
degradation). Cart page and drawer branch on `state.error` and render retry UI
(`router.refresh()` → new promise → store adopts it), because "empty" there
would be a lie.

### Mutations and optimistic UI (lane A — chosen)

Optimistic state stays **userland**; the store holds only authoritative data.
`components/cart/context.tsx` is already shaped for this: pending ops live in
refs, and the display cart is derived at render time
(`applyPendingLineOperations` + `computeCartWithPending` over a base cart). The
port swaps the base cart's source from `useState` + sync `useEffect`s (which
this design deletes: `context-sync.tsx`, the `CartIconClient` seeding effect)
to the store subscription:

```
displayCart = overlay(useCart(s => s.data), pendingOpsRef)
```

Mutation flow: apply pending op to ref → fire server action (same 400ms
debounce/coalescing per variant, leading-edge line updates, per-line request
versioning discarding stale responses — all unchanged) → on success
`store.receive(result.cart)` + delete the pending op. Server actions already
return the fresh cart, so no promise round-trip is needed for mutations. No
double-counting window: `receive()` triggers one render and the overlay is
recomputed from already-cleared refs in that same render (refs don't schedule
commits) — the current code's exact trick with `setCartInternal` swapped for
`receive()`.

Layout-level promise re-ingestion then only covers: retry after failed initial
load, and cross-navigation freshness (actions keep calling `updateTag("cart")`
so the cached `getCart` stays correct). Guard: skip adoption while ops are
pending, or compare `updatedAt`.

**Lane B (rejected for now):** adopting their optimistic layer requires an API
they don't have — optimistic application decoupled from their transport
(`store.mutate(action, executor)` with our server action as executor) — and
their reconciler likely assumes 1 action → 1 response, which can't express our
coalesced adds or stale-response versioning. Re-evaluate when the release
lands; behind `useCartData` a later migration is contained.

## Asks to the Hydrogen team

Hard requirements (cannot be polyfilled):

1. **Provider/store accepts an externally created promise**
   (`Promise<CartData | null>`) — confirmed: "the core primitive handles it."
   Without this, nothing is resolvable during SSR and streaming is impossible
   by construction.
2. **Failures terminate in state** — `loading` flips `false` on fetch failure
   with the error surfaced as `state.error` (+ empty data), never hung and
   never thrown through the store. The suspense gate's termination depends on
   this.
3. **Expose the internal "adopt authoritative cart data" path** as a public
   method (`store.receive(cart)`). It already exists internally for their own
   `/api/cart` responses; the ask is an escape hatch with zero policy —
   frameworks own _when_ to call it. This carries our whole mutation
   reconciliation story.

Ergonomics (polyfillable, but ships subtly-different bugs in every framework
if everyone reinvents it):

4. **`store.ready`** per the contract above (stable identity, post-write
   settle, never rejects, settles once).
5. `useState(() => createCartStore(...))` instead of
   `useMemo(() => ..., [])` in their `CartProvider` — memo caches aren't
   lifetime-guaranteed; a discarded cache silently swaps in an empty store
   mid-session. (Their `useMemo`-in-provider is otherwise correct: per-instance
   store, no cross-request SSR leakage.)

Later / lane B: `store.mutate(action, executor)` — optimistic application with
framework-owned transport.

## Sequencing

1. Wait for Shopify's promise-ingestion release (expected this week) — do not
   build against the current preview's cart surface.
2. Verify against the release: promise prop, failure→state termination,
   re-ingestion behavior on later renders (their current
   `useMemo(() => createCartStore({ initialData }), [])` drops later props on
   the floor), whether `ready`/`receive` shipped.
3. Implement the in-between: provider + `useCartData` gate + `getReady`
   polyfill if needed; delete `context-sync.tsx` and the seeding effects; port
   `context.tsx`'s base-cart source to the store; keep server actions and
   `invalidateCartCache()` untouched.
4. Evaluate lane B only after measuring lane A.
