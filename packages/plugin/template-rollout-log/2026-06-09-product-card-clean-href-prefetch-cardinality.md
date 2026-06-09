---
title: Product cards link to clean /products/[handle] (no ?variant=)
changeKey: product-card-clean-href-prefetch-cardinality
introducedOn: 2026-06-09
changeType: fix
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/collections/infinite-product-grid.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/lib/product.ts
---

## Summary

Product cards linked to `/products/[handle]?variant=<defaultVariantNumericId>`, giving every card a distinct href. Combined with the PDP's `unstable_instant` prefetch and the newly-enabled `partialPrefetching`, prefetches key by full URL, so a grid generates one prefetch entry per card instead of collapsing to one shared `/products/[handle]` shell — prefetch-cache cardinality scales with variants, not routes.

Cards now link to the clean `/products/[handle]`. The `?variant=` was only there to open the PDP on the first *purchasable* variant; that responsibility moves to the PDP itself: `getInitialSelectedOptions` (`lib/product.ts`) now defaults to the first `availableForSale` variant (falling back to `variants[0]`) when no `?variant=` is present.

## Why it matters

The variant in the card href served one purpose — landing on a buyable option when `variants[0]` is sold out. Pushing that default into the PDP keeps that behavior, lets prefetches dedupe by route, and also fixes a latent bug: a bare `/products/[handle]` URL (shared link, sitemap, direct nav) previously opened on `variants[0]` even when sold out, and now opens on the first purchasable variant.

The on-PDP picker is unchanged — option selection still navigates to `?variant=` URLs via `getVariantUrl()`.

> Note: the prefetch-cardinality mechanism is inferred from how `unstable_instant` + `partialPrefetching` + per-URL prefetch keys compose, not confirmed against the Next.js canary internals. The href and default-selection changes are correct regardless; the cardinality win is the motivating hypothesis.

## Apply when

- Product cards link with a `?variant=` query (the as-shipped `ProductCard` / `infinite-product-grid` behavior).
- The storefront uses instant/partial prefetching on the PDP and wants prefetch entries to dedupe per route.

## Safe to skip when

- Cards already link to clean handles, or the storefront deliberately deep-links cards to a specific variant.
- The PDP's no-param default has been customized away from "first variant".

## Validation

1. `pnpm --filter template dev`.
2. From a collection/home grid, confirm card links are `/products/[handle]` with no query string.
3. Open a product whose first variant is out of stock from a card and confirm the PDP still lands on a purchasable variant (not the sold-out `variants[0]`).
4. Confirm the on-PDP option picker still updates the `?variant=` URL and streams the affected slots.

## Follow-up

`defaultVariantId`, `defaultVariantNumericId`, and `defaultVariantSelectedOptions` on the `ProductCard` type are no longer read after this change (still computed in `lib/shopify/transforms/product.ts`). Left in place as reference-type surface; prune if your fork doesn't use them.
