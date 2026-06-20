---
title: Serve /collections/all as Markdown under content negotiation
changeKey: collections-all-markdown-negotiation
introducedInVersion: 0.1.0
introducedOn: 2026-06-20
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/md/collections/[handle]/route.ts
relatedSkills: []
---

## Summary

Fixes a content-negotiation gap on the virtual `/collections/all` route. The page served
`200` as HTML but `404` under `Accept: text/markdown`, because the Markdown route did a
literal `getCollection({ handle: "all" })` — and `all` has no Shopify Storefront API
equivalent (see `collections-all-virtual-route`).

`app/md/collections/[handle]/route.ts` now special-cases `ALL_PRODUCTS_HANDLE`, routing it
through the same `lib/collections/server.ts` helpers the HTML page uses
(`getAllProductsCollection()` + `getAllProductsResultsData()`). Real collection handles are
unchanged. The Shopify data layer stays unaware of the virtual handle.

## Why it matters

`/collections/all` is the nav's "Shop" target and the home hero CTA — the storefront's
primary catalog entry point. Before this fix it was invisible to markdown-negotiating
agents even though the HTML page worked, undercutting the AEO/GEO content-negotiation
contract for the single most important browse URL. It is also linked from `/llms.txt`.

## Apply when

The storefront has the virtual `/collections/all` route (`collections-all-virtual-route`)
and the `/md/**` content-negotiation routes (the template default).

## Safe to skip when

The storefront removed the virtual `/collections/all` route, or does not expose the
`Accept: text/markdown` content-negotiation layer.

## Validation

1. `pnpm --filter template lint` passes.
2. `curl -I -H "Accept: text/markdown" http://localhost:3000/collections/all` returns `200`
   with `Content-Type: text/markdown` (previously `404`).
3. The body is a Markdown collection document titled `# Products` with the catalog grid.
4. `curl -H "Accept: text/markdown" http://localhost:3000/collections/<real-handle>` still
   renders normally.
