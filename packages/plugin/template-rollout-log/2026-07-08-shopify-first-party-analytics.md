---
title: First-party Shopify analytics via @shopify/hydrogen createStorefrontAnalytics
changeKey: shopify-first-party-analytics
introducedOn: 2026-07-08
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/cart/page.tsx
  - apps/template/app/collections/[handle]/page.tsx
  - apps/template/app/layout.tsx
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/app/search/page.tsx
  - apps/template/components/analytics-client.tsx
  - apps/template/components/analytics.tsx
  - apps/template/lib/analytics/client.ts
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/operations/shop.ts
  - apps/template/lib/shopify/transforms/cart.ts
  - apps/template/lib/shopify/transforms/collection.ts
  - apps/template/lib/types.ts
---

## Summary

Wired Shopify's first-party analytics (the preview `@shopify/hydrogen` package the template already uses for its storefront client) into the storefront:

- `lib/analytics/client.ts` — client singleton around `createStorefrontAnalytics` with typed publish helpers (`trackPageView`, `trackProductView`, `trackCollectionView`, `trackSearchView`, `trackCartView`) and `syncCartAnalytics`, which maps the domain `Cart` to the bus's `AnalyticsCart`. Publishes before init are queued (tracker leaf effects run before the initializer's).
- `components/analytics.tsx` — new `ShopifyAnalytics` server component (Suspense-wrapped) that resolves the shop id and passes the store domain + public Storefront token to the client. Renders nothing if env or the shop query is unavailable, so mock/no-env clones build unchanged.
- `components/analytics-client.tsx` — `ShopifyAnalyticsClient` (init + `page_viewed` on route change + cart sync from the cart context) and per-route view trackers.
- Trackers mounted on PDP (`product_viewed`), collection (`collection_viewed`), search (`search_viewed`), and cart (`cart_viewed`) pages; the provider mounts in the root layout inside `CartProvider`.
- Data plumbing the events require: `CART_FRAGMENT` now queries cart `updatedAt`, variant `sku`, and product `vendor` (threaded through the cart transform and domain types as optional fields); `COLLECTION_FIELDS_FRAGMENT` now queries `id`; new cached `getShopId()` operation (`lib/shopify/operations/shop.ts`).

Consent uses the Customer Privacy API in its default `no-banner` mode; the Storefront token is passed to the client because the consent script requires it, and it is a public token by design (see `lib/shopify/storefront.ts`). No new environment variables.

## Why it matters

Merchant-side reporting, conversion attribution, and app-installed pixels depend on Shopify's first-party events. Storefronts built from the template previously emitted none of them, so headless traffic was invisible in Shopify analytics dashboards.

The cart tracker dedupes by `cart.updatedAt`, so the template's optimistic cart updates (which carry a stale `updatedAt`) are skipped automatically and only server-confirmed mutations emit `product_added_to_cart` / `product_removed_from_cart`.

## Apply when

- The storefront still uses the template's `CartProvider`, cart fragment/transform, and route structure.
- The merchant wants headless sessions attributed in Shopify's analytics dashboards.

## Safe to skip when

- A downstream analytics stack (e.g. a CMP or tag manager) already publishes Shopify's Monorail events.
- The storefront replaced the cart context or fragments wholesale — the fragment/type additions (`updatedAt`, `sku`, `vendor`, collection `id`) would need manual porting first.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` (all routes should keep their PPR status).
2. With real store env vars, load any page and check `document.cookie` for `_shopify_y` after the consent script loads, and the network tab for a `monorail-edge.shopifysvc.com` request on navigation.
3. Add an item to the cart; a `product_added_to_cart` publish should follow the server-confirmed cart (subscribe via `getAnalytics`-style `bus.subscribe` or check Monorail requests).
4. Without `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_ACCESS_TOKEN`, the build renders no analytics client and nothing is published.
