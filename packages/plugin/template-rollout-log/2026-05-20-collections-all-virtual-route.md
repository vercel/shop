---
title: Virtual /collections/all route and Shop nav target
changeKey: collections-all-virtual-route
introducedOn: 2026-05-20
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/collections/all/page.tsx
  - apps/template/app/collections/[handle]/page.tsx
  - apps/template/app/page.tsx
  - apps/template/components/collections/collection-page.tsx
  - apps/template/lib/collections/server.ts
  - apps/template/lib/config.ts
  - apps/template/lib/i18n/messages/en.json
  - apps/template/lib/i18n/messages/en.d.json.ts
relatedSkills: []
---

## Summary

`/collections/all` is now a literal route at `app/collections/all/page.tsx`, fully isolated from the dynamic `[handle]` route and from the Shopify data layer. The navbar "Shop" link and the home hero CTA both point at it.

- `app/collections/all/page.tsx` — dedicated route. Builds a localized synthesized collection and routes products through the root catalog query.
- `lib/collections/server.ts` exports the "all" module surface: `ALL_PRODUCTS_HANDLE`, `getAllProductsCollection()`, and `getAllProductsResultsData({ locale, searchStatePromise })`.
- `CollectionDetailPage` now takes pre-built `collectionResultsDataPromise` and `searchStatePromise` props, so each route owns its own data path. The component no longer knows about "all" or about how to fetch products.
- `lib/shopify/operations/collections.ts` and `lib/shopify/operations/products.ts` are unchanged from their pre-feature state — the Shopify data layer has no awareness of the virtual handle.
- New translation keys `collections.all.{title,description}` in `en.json` / `en.d.json.ts` (currently `"Products"` and `""`).
- Navbar Shop link → `/collections/all`; home hero CTA "Shop Now" → `/collections/all`.

## Why it matters

Shopify's `/collections/all` is a Liquid-storefront convention with no Storefront API equivalent. Customers and search engines expect the URL to work. Isolating the virtual route into its own file (and its own data helpers in `lib/collections/server.ts`) means the dynamic `[handle]` route stays focused on real Shopify collections, and the data layer is free of "magic handle" branches.

## Apply when

- The storefront still 404s on `/collections/all` or routes catalog entry points to `/search`.
- The storefront wants a canonical "all products" URL for SEO and external linking.

## Safe to skip when

- The storefront has a custom catalog landing route with a different path.
- The storefront uses Shopify Markets per-domain routing with bespoke per-region catalog pages.

## Validation

1. `pnpm --filter template lint` passes.
2. Visit `/collections/all` — H1 "Products", grid of all catalog products. No filter sidebar entries (expected — root `products(...)` query has no facets).
3. `?sort=price-low-to-high` changes the product order.
4. Navbar "Shop" link and home "Shop Now" CTA both navigate to `/collections/all`.
5. `/collections/<real-handle>` still renders normally through the dynamic route.
