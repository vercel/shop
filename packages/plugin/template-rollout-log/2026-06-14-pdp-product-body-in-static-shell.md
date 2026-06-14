---
title: Render the PDP product body in the static shell (await-at-top, no runtime re-render)
changeKey: pdp-product-body-in-static-shell
introducedOn: 2026-06-14
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/lib/shopify/operations/products.ts
---

## Summary

The PDP now resolves the product at the top of the page (`await params` + `await getProduct`) and renders the product body — title, description, gallery, JSON-LD — directly, so it is baked into the **static prerender (shell)** as a single copy. Only the variant-dependent UI (price, options, buy buttons, color gallery) streams, inside its own Suspense boundaries keyed on `searchParams`.

Three coupled changes make this work:

1. **`page.tsx`** — `await params`/`getProduct` at the top and pass the resolved `product` down (previously the product promise was threaded, unawaited, into the outer `<Suspense>`). The outer Suspense around the product section is removed.
2. **`page.tsx`** — drop `export const instant` / `export const prefetch = "allow-runtime"`. `allow-runtime` re-renders the whole tree at request time, which re-introduces the problem below.
3. **`getProduct`** — back to plain `"use cache"` (from `"use cache: remote"`). `remote` resolves at request time, _outside_ the static shell, so it does not bake in. This partially reverses `shopify-reads-remote-cache` (2026-06-13) for the product-by-handle read only; collection/menu/sitemap reads are unchanged.

## Why it matters

Previously the product body was rendered in **two** places: the frozen prerendered shell **and** a per-request RSC flight (because the data promise was threaded into `<Suspense>` and the route used `prefetch = "allow-runtime"`, both of which re-render the body at request time). When the cached value at request time differed from what was baked into the shell — which happens as the Runtime Cache entry evicts/refreshes independently of the full-route shell — the two copies disagreed. The visible result: a **React hydration mismatch** and product copy that appeared to **change on its own**, with no Shopify event.

Awaiting at the top puts the body in the shell as a single source; removing `allow-runtime` stops the request-time re-render. The body is then served from the frozen prerender in both the shell HTML and the flight, so they cannot diverge. It changes only when the whole prerender regenerates (coherently), on the `cacheLife` window or a `revalidateTag`. Confirmed with an A/B against an otherwise-identical build that kept `prefetch` — it tore under drift; this one held coherent.

The Shopify webhook is still useful, but for **freshness** (regenerating the shell promptly on edits), not coherence. This corrects an earlier, incorrect diagnosis that framed the webhook as required for coherence.

## Apply when

- Always, for product (and similar) detail routes that mix cached body content with request-time inputs (`searchParams`, etc.). Resolve the cacheable data at the top so it lands in the static shell; reserve Suspense + streaming for the genuinely request-time parts.

## Safe to skip when

- Your detail route is fully dynamic (no static shell) or fully static (no request-time input) — neither produces the two-copy split, so there's nothing to reconcile.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build`.
2. Fetch a PDP and confirm the `<meta name="description">` (shell) and the streamed RSC flight carry the same description — no stale-shell/fresh-flight split, no hydration error in the browser console.
3. Edit a product in Shopify, then drive traffic for a while: the page either holds the old value or updates to the new one, but never shows the shell and body disagreeing.
