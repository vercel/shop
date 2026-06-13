---
title: Shopify reads — move all stable reads back to "use cache: remote" for durable cross-instance caching
changeKey: shopify-reads-remote-cache
introducedOn: 2026-06-13
changeType: refactor
defaultAction: review
supersedes: shopify-static-cache-scope
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/menu.ts
  - apps/template/lib/shopify/operations/sitemap.ts
---

## Summary

All stable Shopify read operations now use `"use cache: remote"` with `cacheLife("max")` and their existing cache tags. This covers product-by-handle, catalog browse (`getCatalogProducts`), recommendations, product-by-id, batch product-by-ids/handles, collection list/detail, menu, and sitemap reads. The high-cardinality search/filter/sort/cursor flows (`getFilteredCatalogProducts`, `getSearchFacets`, `searchIndexProducts`, `getCollectionProducts`) were already remote and are unchanged.

This **supersedes [`shopify-static-cache-scope`](./2026-05-06-shopify-static-cache-scope.md)** (2026-05-06), which had moved these same stable reads from `"use cache: remote"` to vanilla `"use cache"`.

## Why it matters

The 2026-05-06 change assumed vanilla `"use cache"` would behave like durable, ISR-style cache entries. That only holds for params prerendered at build. The template's `generateStaticParams` seeds a single product/collection handle, so on serverless every other read filled a **per-instance in-memory** cache that does not persist across instances or between requests. The observable symptom: PDPs and other reads silently refetched from Shopify on every cold instance and after each deploy, instead of staying cached until a content change.

`"use cache: remote"` stores entries in Vercel's shared Runtime Cache — durable across all serverless instances and requests, and invalidated on-demand by the webhook handler's `revalidateTag()` calls (`app/api/webhooks/shopify`). Net effect: reads stay cached until a Shopify event (or a manual `revalidateTag`) changes them, which is the intended "cache until invalidated" behavior.

## Apply when

- You deploy to a serverless / Fluid Compute target and do not prerender your full catalog at build.
- You want product, collection, menu, and sitemap reads to stay cached until webhook invalidation rather than refetching on cold starts and deploys.

## Safe to skip when

- You prerender your entire catalog via `generateStaticParams` — vanilla `"use cache"` then yields durable build-time ISR entries with no Runtime Cache cost.
- You self-host with persistent process memory, where vanilla `"use cache"` already persists across requests.
- You want to avoid the Runtime Cache's per-lookup network latency and platform cost for infrequently-hit reads. The sitemap reads in particular have marginal benefit from remote caching — keep them on `"use cache"` if you'd rather not pay for them.

## Validation

1. `pnpm --filter template lint`.
2. `pnpm --filter template build` — confirm the app builds cleanly under `cacheComponents: true`.
3. In production, edit a product in Shopify Admin. Confirm the PDP updates only after the webhook fires `revalidateTag()` (not on an arbitrary timer), and that the cached page survives a redeploy / cold start while its tag is still valid.
