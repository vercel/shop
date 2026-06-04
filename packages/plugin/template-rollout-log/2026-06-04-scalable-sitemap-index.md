---
title: Scalable sitemap index
changeKey: scalable-sitemap-index
introducedOn: 2026-06-04
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/sitemap.xml/route.ts
  - apps/template/app/sitemap/[type]/[page]/route.ts
  - apps/template/lib/sitemap.ts
  - apps/template/lib/shopify/operations/sitemap.ts
  - apps/template/app/api/webhooks/shopify/route.ts
relatedSkills:
  - /vercel-shop:enable-i18n
  - /vercel-shop:enable-shopify-cms
  - /vercel-shop:enable-shopify-markets
---

## Summary

Replace the single `app/sitemap.ts` metadata response with a sitemap index at `/sitemap.xml` and paged child sitemap route handlers at `/sitemap/[type]/[page].xml`.

Shopify's sitemap API now supplies paged products, collections, pages, blogs, articles, and metaobjects. A static child sitemap keeps template-owned crawlable pages (`/`, `/about`, and `/collections/all`) discoverable. Product, collection, and metaobject webhooks invalidate the shared `sitemap` cache tag.

## Why it matters

The old sitemap fetched every product handle into one response and truncated collections at the first 250 records. That grows linearly with catalog size and silently omits resources.

## Apply when

- Storefront still uses the template's single `app/sitemap.ts`.
- Catalogs may exceed 250 collections or are large enough that one product sitemap is expensive.
- Storefront wants Shopify pages, blogs, articles, or public metaobjects represented in sitemap discovery.

## Safe to skip when

- Storefront already publishes an equivalent paged sitemap index.
- Sitemap generation is delegated to another service.

## Validation

Run `pnpm --filter template build`. Start the template and request `/sitemap.xml`, `/sitemap/static/1.xml`, and `/sitemap/products/1.xml`. Confirm the root response is a sitemap index, child responses are XML URL sets, and invalid paths such as `/sitemap/products/0.xml` return `404`.
