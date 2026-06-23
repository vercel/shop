---
title: Stop the Shopify webhook from whole-catalog invalidation (scoped products + collections, drop inventory_levels)
changeKey: webhook-targeted-invalidation
introducedOn: 2026-06-23
changeType: fix
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/api/webhooks/shopify/route.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/docs/content/docs/anatomy/webhooks.mdx
  - apps/docs/content/docs/shopify/index.mdx
---

## Summary

The Shopify webhook handler used to invalidate the broad `products` tag on nearly every branch. That tag wraps **every** list, search, and PDP read, so almost any Shopify edit flushed the entire catalog cache. This change makes the handler invalidate only fine-grained, scoped tags:

- **`products/*`** — now fires only `product-{handle}`, `product-{numericId}` (from `admin_graphql_api_id`, falling back to payload `id`), and `recommendations-{handle}`. No more `products`/`collections`.
- **`collections/*`** — now fires only `collection-{handle}`. The broad `products`, broad `collections`, and `menus` tags are all dropped.
- **`inventory_levels/*`** — branch removed entirely.

`metaobjects/*` is unchanged.

## Why it matters

Fine-grained invalidation is **sufficient** by design: the reads in `lib/shopify/operations/products.ts` call the `tagProducts()` helper, which stamps every list/search/collection/recommendation cache entry with the `product-{numericId}` tag of each product it contains. So busting one product's numeric tag cascades to exactly the cached surfaces that display it, and collection reads are covered by `collections` + `collection-{handle}`. The broad `products` tag was pure over-invalidation — every product or collection edit threw away the whole catalog's cached reads and forced cold refetches across the store.

- **Products:** the webhook's handle/numeric tags line up exactly with the operations layer — `product-{handle}` matches `getProduct`/`getProductVariant`/`getProductWithVariants`, and `product-{numericId}` matches the `tagProducts()` stamps on list reads (the webhook uses the same `getNumericShopifyId()` extraction).
- **Collections:** `collection-{handle}` is stamped on `getCollection` (PLP metadata), `getCollectionProducts` (`cacheTag("products", "collections", collection-{handle})`), and — new in this change — every entry of the all-collections list via a `tagCollections()` helper in `getCollections` (mirroring `tagProducts`). So one `collection-{handle}` bust now covers the collection's PLP **and** the all-collections list whenever an existing collection is edited or deleted; the broad `collections` tag is redundant. (A brand-new collection still won't appear in the cached list until expiry, since its tag wasn't present when the list was cached — the same limitation a newly created product has in cached catalog lists.) Product cards within a collection list are independently covered by their own `product-{numericId}` tags via the product webhook. `menus` is dropped because it never belonged: menu titles/links are edited independently in Shopify Navigation, there's no menu webhook topic, so that cache already relied on expiry.
- **Inventory:** the `inventory_levels/*` payload identifies an `inventory_item_id`/`location_id`, not a product, so it can't be scoped to a per-product tag without an extra lookup — and firing the broad `products` tag on every stock tick is the worst case for cache hit rates. The branch is removed; availability now propagates at cache expiry (or via any live, uncached reads). Registering the topic anyway is harmless (it hits no branch and returns an empty `tagsInvalidated`).

## Apply when

- You run the shipped webhook handler and want Shopify edits to invalidate only the affected surfaces instead of cold-flushing the entire catalog cache on every change.

## Safe to skip when

- You customized the webhook branches, or you deliberately rely on whole-catalog invalidation (e.g. you added catalog-wide cached reads that are **not** stamped per-product via `tagProducts()`, or you have a real-time inventory requirement that the prior whole-catalog inventory bust was satisfying).

## Adoption notes

- If you added new cached reads that surface product data, confirm they go through `tagProducts()` (or otherwise carry a `product-{numericId}` / `collection-{handle}` tag) — otherwise an edit will no longer bust them now that the broad `products` safety net is gone.
- Inventory: if you need near-instant stock/availability updates, either keep availability on a live (uncached) read path, or re-add a scoped inventory branch that resolves `inventory_item_id` → product and fires that product's tags.
- Parse-failure behavior for the products branch: with no generic tag to seed, an unparseable products payload now logs and invalidates nothing rather than busting the catalog. Real Shopify product webhooks always carry a parseable `id`/`admin_graphql_api_id`.
- All-collections list: `getCollections` now stamps a `collection-{handle}` tag per entry (`tagCollections`), so collection **edits and deletes** bust it via the same per-collection tag the webhook fires — no broad `collections` tag needed. The only residual gap is collection **creation**: a brand-new collection isn't in the cached list, so its `collection-{handle}` tag isn't on that entry and it won't appear until cache expiry. This is acceptable for the stock consumers (`app/llms.txt`, the `list-collections` agent tool, build-time `generateStaticParams`); if you need instant create-visibility on a customer-facing collection index, put that read on a live/uncached path.
- Collection deletes: invalidation keys off `payload.handle`. Shopify `collections/delete` payloads sometimes carry only a numeric `id`; collection reads are tagged by handle (no numeric collection tag exists), so a handle-less delete invalidates nothing and the deleted collection's PLP lingers until expiry. Add a numeric-`id`→handle resolution (or a numeric collection tag) if instant delete propagation matters.

## Validation

1. `pnpm --filter template lint`, `pnpm --filter docs build`.
2. `curl -X POST http://localhost:3000/api/webhooks/shopify -H "x-shopify-topic: products/update" -d '{"handle":"speaker","admin_graphql_api_id":"gid://shopify/Product/123"}'` → `tagsInvalidated` is `["product-speaker","recommendations-speaker","product-123"]` (no `products`/`collections`).
3. `curl -X POST http://localhost:3000/api/webhooks/shopify -H "x-shopify-topic: collections/update" -d '{"handle":"sale"}'` → `tagsInvalidated` is `["collection-sale"]` (no `products`, no `collections`, no `menus`).
4. `curl -X POST http://localhost:3000/api/webhooks/shopify -H "x-shopify-topic: inventory_levels/update" -d '{}'` → `tagsInvalidated` is `[]`.
5. Edit a single product, then a single collection, in Shopify Admin and confirm only the affected surfaces refresh while unrelated cached reads stay warm.
