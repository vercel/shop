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

The listing read is cached (`"use cache"` + `cacheLife("max")`) and tagged `collection-{handle}` per collection (via `tagCollections`) and `product-{numericId}` per first product, so a collection edit or a fallback product image change busts the page.

Now that there's a read where the *set* of collections is rendered, this change splits the collections tagging into three clear tiers:

- **`collection-{handle}`** (per collection) — on `getCollection`, `getCollectionProducts`, and stamped on every all-collections read via `tagCollections`. Fired by the webhook on every `collections/*` topic with a handle.
- **`collections-index`** (the set / listing) — on the all-collections reads only: `getCollections`, the new `getCollectionsListing`, and the collections sitemap (`lib/shopify/operations/sitemap.ts`). Fired by the webhook on **`collections/create` and `collections/delete`**, since those change membership. This surfaces a new collection (and drops a deleted one) immediately, closing the create-lag caveat from `webhook-targeted-invalidation`, without touching any individual PLP.
- **`collections`** (break-glass) — re-added to *every* collection read (PLP metadata, PLP product lists, listing, sitemap) but **never fired by a webhook**. It's a manual purge lever: `revalidateTag("collections")` flushes all collection data at once (e.g. after a bulk import). `products` plays the same role for product reads.

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
3. `curl -X POST .../api/webhooks/shopify -H "x-shopify-topic: collections/create" -d '{"handle":"new-arrivals"}'` → `tagsInvalidated` is `["collections-index","collection-new-arrivals"]`; `collections/delete` returns the same; `collections/update` returns only `["collection-new-arrivals"]`.
