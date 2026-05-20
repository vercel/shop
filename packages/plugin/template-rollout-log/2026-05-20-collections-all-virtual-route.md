---
title: Virtual /collections/all route and Shop nav target
changeKey: collections-all-virtual-route
introducedOn: 2026-05-20
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/collections/[handle]/page.tsx
  - apps/template/components/collections/collection-page.tsx
  - apps/template/lib/config.ts
  - apps/template/lib/i18n/messages/en.json
  - apps/template/lib/i18n/messages/en.d.json.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/products.ts
relatedSkills: []
---

## Summary

`/collections/all` now resolves to a synthesized "All Products" listing instead of returning 404. The template also points the navbar "Shop" link at `/collections/all` (previously `/search`).

- `getCollection("all")` short-circuits to a synthesized `Collection` (no Storefront API round-trip).
- `getCollectionProducts({ collection: "all" })` routes through the root `products(...)` query — full sort parity with other collection pages, no facet filters (the root query does not expose `filters`).
- The collection header and `generateMetadata` localize the title/description via the new `collections.all.{title,description}` translation keys.
- `generateStaticParams` includes `"all"` so the route prerenders.

## Why it matters

Shopify's `/collections/all` is a Liquid-storefront convention with no Storefront-API equivalent — merchants and customers expect the URL to work, and external links (search engines, Shopify admin previews) point to it. Routing it through the root `products(...)` field matches Shopify's "all products" semantics. Aligning the navbar Shop link with this URL gives a stable, indexable entry point for the catalog.

## Apply when

- The storefront still 404s on `/collections/all` or routes the Shop link to `/search`.
- The storefront wants a canonical "all products" URL for SEO and external linking.

## Safe to skip when

- The storefront has already implemented a custom "all products" route with a different handle or path.
- The storefront uses Shopify Markets per-domain routing and has bespoke catalog landing pages.

## Validation

1. `pnpm --filter template lint` passes.
2. Visit `/collections/all` — page renders with title "All Products" and a product grid sorted by the active sort key. No facet sidebar entries (expected).
3. Click the navbar "Shop" link — it navigates to `/collections/all`.
4. Sort options switch the order without errors.
5. A merchant-created collection with a non-`all` handle continues to render through the normal Shopify path.
