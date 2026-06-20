---
title: Product OpenGraph tags on the PDP
changeKey: pdp-product-opengraph-tags
introducedInVersion: 0.1.0
introducedOn: 2026-06-20
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/product-detail/open-graph.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/lib/seo.ts
relatedSkills: []
---

## Summary

Product detail pages now emit OpenGraph "product" object tags instead of a generic
`og:type=website`.

- `components/product-detail/open-graph.tsx` *(new)* — `ProductOpenGraph` server component
  rendering raw `<meta property>` tags (React 19 hoists them to `<head>`):
  `og:type=product`, `og:price:amount`, `og:price:currency`, `og:availability`, plus the
  `product:price:amount` / `product:price:currency` / `product:availability` namespace.
  Both namespaces are emitted because Facebook reads `product:*` while Pinterest Rich Pins
  and older parsers read `og:price:*` / `og:availability`. Priced off the "from" (min)
  variant price to match the displayed price and the JSON-LD `AggregateOffer` `lowPrice`.
- `product-detail-section.tsx` — renders `<ProductOpenGraph>` beside `<ProductSchema>`.
- `app/products/[handle]/page.tsx` — drops `type: "website"` from the PDP's `buildOpenGraph`
  call so there is no duplicate/conflicting `og:type`.
- `lib/seo.ts` — `buildOpenGraph`'s `type` is now optional and only emitted when provided.
  Next only renders `og:type` when the key is present, so omitting it lets the component own
  `og:type=product`. All other callers still pass `type: "website"` and are unchanged.

The Metadata API has no product OG variant, and its `other` field emits `name=` rather than
the `property=` that OG parsers require — hence the dedicated component.

## Why it matters

JSON-LD already covers structured-data agents, but social/link-unfurl surfaces (iMessage,
Slack, Facebook) and Pinterest Rich Pins lean on OG `product` tags for price and
availability. A generic `og:type=website` leaves those surfaces without a price or stock
signal.

## Apply when

The storefront uses the template's `buildOpenGraph` helper and PDP structure (the default).

## Safe to skip when

The storefront has replaced the OG metadata pipeline, or intentionally suppresses price
exposure in shared previews.

## Validation

1. `pnpm --filter template lint` passes.
2. `curl <pdp-url>` shows exactly one `<meta property="og:type" content="product">`, plus
   `og:price:amount` / `og:price:currency` / `og:availability` and the `product:*` triplet,
   all with `property=`.
3. Home, collection, and `/collections/all` still emit `<meta property="og:type" content="website">`.
