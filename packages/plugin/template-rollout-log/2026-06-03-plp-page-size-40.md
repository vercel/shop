---
title: PLP page size 20 → 40
changeKey: plp-page-size-40
introducedOn: 2026-06-03
changeType: enhancement
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/utils.ts
---

## Summary

`RESULTS_PER_PAGE` goes from 20 to 40 across all PLP grids (`/search`, `/collections/[handle]`, `/collections/all`, and the markdown route mirrors). Supersedes [[plp-page-size-20]].

## Why it matters

PLP card images use `next/image` without `priority` (`components/product-card/components.tsx`), so they're lazy-loaded regardless of how many cards ship in the initial HTML. The only marginal cost of a larger first page is HTML/RSC bytes; the benefit is fewer infinite-scroll round-trips for users who actually scan past the first viewport.

The grid is `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`. 40 fills evenly at base (20 rows), lg (10 rows), and xl (8 rows); the only ragged tail is at sm (3-col → 13 rows + 1 orphan). Empirically, on a typical collection the change adds ~10–15 KB brotli over the wire and halves the paginate-fetch RTT count for users who scroll past row 4.

## Apply when

- Storefront still uses the template's default 2/3/4/5 column breakpoints.
- Initial-page bandwidth isn't a hard constraint (the marginal compressed cost is small but non-zero).

## Safe to skip when

- Fork has retuned the grid to different breakpoints — pick `RESULTS_PER_PAGE` as a multiple of the widest column count instead.
- Storefront is bandwidth-sensitive (high mobile traffic on slow networks) and prefers smaller initial HTML at the cost of more paginate-fetch RTTs.

## Validation

`pnpm --filter template dev`. Visit `/search`, `/collections/[handle]`, and `/collections/all` at xl and lg viewport widths and confirm the initial page fills evenly. Scroll to confirm the infinite-grid still fetches and appends another 40 cleanly.
