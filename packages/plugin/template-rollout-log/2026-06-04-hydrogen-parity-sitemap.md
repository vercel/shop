---
title: Hydrogen-parity paged sitemap for products and collections
changeKey: hydrogen-parity-sitemap
introducedOn: 2026-06-04
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/sitemap.xml/route.ts
  - apps/template/app/sitemap/[shard]/route.ts
  - apps/template/lib/shopify/operations/sitemap.ts
---

## Summary

The sitemap now emits an index plus paged child sitemaps backed by Shopify's Storefront `sitemap(type:)` query — the same model Hydrogen uses. The previous implementation loaded every product handle into a single XML response and capped collections at 250.

- `/sitemap.xml` — sitemap index listing every child shard.
- `/sitemap/static.xml` — the home page (one entry).
- `/sitemap/products-{n}.xml` — up to 250 product URLs per shard, one shard per Shopify sitemap page.
- `/sitemap/collections-{n}.xml` — same shape for collections.

Each product/collection URL carries `lastmod` from Shopify's `updatedAt`. `robots.ts` still points to `/sitemap.xml` (unchanged).

The previous `app/sitemap.ts` is gone, along with its `getAllProductHandles` cursor loop. Sitemap generation is now two route handlers (`app/sitemap.xml/route.ts`, `app/sitemap/[shard]/route.ts`) and two operations (`getShopifySitemapPagesCount`, `getShopifySitemapPage`).

## Why it matters

- Stores with more than 250 collections were silently truncated — every collection past the cap was invisible to search engines. Now every collection is indexed.
- Stores with tens of thousands of products previously generated a single multi-MB XML that breached Google's 50k-URLs-per-file limit and could OOM during prerender. Sharding to ≤250 entries per child sitemap keeps each file small and well within search engine limits.
- The Storefront `sitemap` query is purpose-built for this — Shopify computes the pagination, so a future Shopify-side optimization (e.g. richer `updatedAt` semantics) flows through automatically.

## Apply when

- The storefront still ships the default `/products/[handle]` and `/collections/[handle]` routes at unprefixed paths.
- SEO traffic matters and the catalog is non-trivial (or expected to grow).

## Safe to skip when

- The storefront has replaced `app/sitemap.ts` with a hand-rolled implementation that already paginates and shards.
- The catalog is permanently small enough (<250 collections, <10k products) that the old single-file sitemap is sufficient.

## Why route handlers, not `app/sitemap.ts` + `generateSitemaps`

Next.js 16 reserves `/sitemap.xml` for `app/sitemap.ts`. With `generateSitemaps`, that file only emits the *children* at `/sitemap/[id].xml` — it does not auto-emit a sitemap index, but it still claims the `/sitemap.xml` URL, which means a parallel `app/sitemap.xml/route.ts` collides. The cleanest fix is to drop `app/sitemap.ts` entirely and own both routes as plain handlers. URL shape is identical to Hydrogen's.

## Tradeoff

The change drops the `getAllProductHandles` helper. Any downstream code that imported it must move to `getShopifySitemapPage("PRODUCT", n)` or another product-listing operation. In this template, `app/sitemap.ts` was the only caller.

Locale alternates, Shopify Markets, pages, blogs, articles, metaobjects, and image-sitemap extensions are all deliberately out of scope. Image sitemaps are a particularly noteworthy gap: Shopify's `Sitemap.image.filepath` is a path fragment, not an absolute URL, and `<image:loc>` requires absolute URLs. Wiring that up requires resolving the shop's CDN base — left as future work.

## Validation

1. `pnpm --filter template build` succeeds under `cacheComponents: true`.
2. `curl http://localhost:3000/sitemap.xml` returns a `<sitemapindex>` listing `static`, `products-{n}`, and `collections-{n}` children.
3. `curl http://localhost:3000/sitemap/products-1.xml` returns a `<urlset>` with up to 250 entries, each with a `<lastmod>`.
4. Total product count across all `products-*` shards matches the Shopify admin product count.
