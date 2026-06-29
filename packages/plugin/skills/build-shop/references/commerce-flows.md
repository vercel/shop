# Commerce Flows

Verify commerce outcomes without prescribing visual composition. Adapt the presentation freely while preserving the applicable behaviors below.

## Reference implementation

- Route docs: [route reference](https://vercel.shop/docs/reference/routes)
- Cart docs: [cart anatomy](https://vercel.shop/docs/anatomy/cart)
- Product and PLP docs: [PDP anatomy](https://vercel.shop/docs/anatomy/pages/pdp), [PLP anatomy](https://vercel.shop/docs/anatomy/pages/plp)
- Source paths to inspect by flow: `apps/template/app/`, `apps/template/components/product-detail/`, `apps/template/components/collections/`, `apps/template/components/cart/`, `apps/template/components/cart-page/`, `apps/template/app/account/`, `apps/template/lib/shopify/operations/`, `apps/template/lib/cart/`
- Public source fallback: [template source](https://github.com/vercel/shop/tree/main/apps/template)

## Discovery

- Show localized price and currency consistently across navigation, listings, search, PDP, and cart.
- Preserve product and collection URLs through filters, sorting, pagination, locale changes, and back/forward navigation.
- Keep useful content visible while request-dependent results transition.
- Provide intentional empty, missing-image, unavailable-product, and transport-error states.
- Ensure product links, filters, sorting, pagination, and search remain keyboard operable with visible focus.

## Product selection

- Resolve default and URL-selected options consistently.
- Update selected state, media, price, compare-at price, availability, and merchandise ID from the same effective variant.
- Prevent purchase when the selection is incomplete or unavailable, and explain why without relying on color alone.
- Keep option changes responsive while the exact variant resolves; do not block stable product content.
- Preserve shareable selection URLs and back/forward behavior.

## Cart and checkout handoff

- Create a cart when none exists and persist its identifier using the existing server cookie path.
- Apply each optimistic intent exactly once, then reconcile warnings, errors, and the canonical Shopify cart without quantity flashes or reversions.
- Preserve line identity, attributes, discounts, buyer identity, delivery state, totals, currency, and checkout URL.
- Call `invalidateCartCache()` after every cart mutation.
- Keep checkout handoff usable without requiring unrelated client state to finish hydrating.

## Customer account

- Keep auth gates outside presentation and never expose customer access tokens to client components.
- Keep profile, orders, addresses, and mutations scoped to the active customer.
- Surface Shopify user errors at the relevant field or action.
- Verify signed-out redirects, expired sessions, empty histories, pagination, mutation failures, and slow Customer Account API responses.

## Content lifecycle

- Preserve cache tags and webhook invalidation for public Shopify content.
- Never share cart, session, authorization, or customer data through public caches.
- Confirm an Admin change moves from Shopify through invalidation to the intended shell or runtime result without mixed stale and fresh copies.

## Required end-to-end checks

Run the flows affected by the change:

1. Browse or search, filter or sort, open a product, and use back navigation.
2. Select a variant, add it to an empty cart, add the same variant again, change quantity, remove it, and open checkout. Counts must move monotonically to the confirmed result without double-application or reversion.
3. Exercise sold-out, incomplete-selection, missing-media, empty-result, empty-cart, and API-failure states.
4. Refresh after cart creation and confirm state persists and reconciles.
5. When auth is enabled, sign in, visit each account surface, mutate profile/address data, and sign out.
6. Verify keyboard navigation, focus restoration for overlays, announcements for asynchronous outcomes, and mobile interaction.
