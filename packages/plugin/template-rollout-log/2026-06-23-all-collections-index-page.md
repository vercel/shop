---
title: Add an all-collections index page at /collections
changeKey: all-collections-index-page
introducedOn: 2026-06-23
changeType: feat
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/api/webhooks/shopify/route.ts
  - apps/template/app/collections/page.tsx
  - apps/template/components/collections/collection-card.tsx
  - apps/template/lib/shopify/operations/collections.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/types.ts
  - apps/template/lib/i18n/messages/en.json
  - apps/docs/content/docs/anatomy/webhooks.mdx
  - apps/docs/content/docs/reference/routes.mdx
  - apps/docs/content/docs/shopify/index.mdx
---

## Summary

Adds the previously-missing all-collections index at `/collections` (`app/collections/page.tsx`) — a responsive grid of collection cards. Each card shows the collection's own image, **falling back to the first product's featured image** when the collection has none, matching Shopify Liquid's `collection.featured_image` semantics (the behavior the default Horizon theme renders).

- New operation `getCollectionsListing` in `lib/shopify/operations/collections.ts` fetches all collections **and** each collection's first product image in a single query (`collections(first:) { ...CollectionFields products(first: 1) { featuredImage } }`) — no N+1.
- New type `CollectionWithThumbnail extends Collection { thumbnail: Image | null }` in `lib/types.ts`; the operation resolves `thumbnail = collection.image ?? firstProduct.featuredImage ?? null`.
- New presentational wrapper `components/collections/collection-card.tsx` (image with `ImagePlaceholder` fallback + title), styled to match `ProductCard`.
- Reuses the existing `collections.title` / `collections.description` / `collections.viewCollection` strings and adds `collections.empty`.

## Why it matters

`getCollections` already existed but was only consumed by `llms.txt`, build-time `generateStaticParams`, and the agent tool — there was no browsable collections page. This gives storefronts a standard collections index out of the box, consistent with Horizon.

The listing read is cached (`"use cache"` + `cacheLife("max")`) and tagged for the per-item webhook scheme introduced in `webhook-targeted-invalidation`: `collections`, plus `collection-{handle}` per collection (via `tagCollections`) and `product-{numericId}` per first product. So a collection edit (`collection-{handle}`) or a fallback product image change (`product-{numericId}`) busts the page.

This change also finishes scoping the `collections` tag now that there's a read where it's meaningful:

- The broad `collections` tag is **confined to the all-collections reads** — `getCollections`, the new `getCollectionsListing`, and the collections sitemap. It was removed from the per-collection reads `getCollection` (`lib/shopify/operations/collections.ts`) and `getCollectionProducts` (`lib/shopify/operations/products.ts`), which keep only `collection-{handle}`.
- The webhook's `collections/*` branch now fires the broad `collections` tag on **`collections/create`** (in addition to `collection-{handle}`). This surfaces a brand-new collection in the listing/sitemap immediately — closing the create-lag caveat noted in `webhook-targeted-invalidation` — while leaving every other collection's PLP untouched (they no longer carry `collections`). Updates and deletes of existing collections are still covered by `collection-{handle}` (stamped on the listing via `tagCollections`), so they don't fire the broad tag.

## Apply when

- You want a customer-facing collections index, or you referenced `/collections` anywhere and got a 404.

## Safe to skip when

- Your storefront has no use for an all-collections page (e.g. navigation is curated by menus and you never link `/collections`).

## Adoption notes

- The page is not linked from the nav by default; add a nav entry if you want it discoverable.
- The card image fallback requires the `products(first: 1) { featuredImage }` selection in `getCollectionsListing`. If you only need the collection's own image, drop that selection and the per-product tagging.
- New keys go in every locale catalog you maintain; the stock template ships only `en.json`.

## Validation

1. `pnpm --filter template lint`, `pnpm --filter template build`, `pnpm --filter docs build`.
2. Load `/collections`: cards render, collections without their own image show the first product's image, each card routes to its PLP, grid is responsive.
3. `curl -X POST .../api/webhooks/shopify -H "x-shopify-topic: collections/create" -d '{"handle":"new-arrivals"}'` → `tagsInvalidated` is `["collections","collection-new-arrivals"]`; `collections/update` for the same handle returns only `["collection-new-arrivals"]`.
