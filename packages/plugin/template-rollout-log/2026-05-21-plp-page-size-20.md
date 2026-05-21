---
title: PLP page size 24 → 20
changeKey: plp-page-size-20
introducedOn: 2026-05-21
changeType: enhancement
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/utils.ts
---

## Summary

`RESULTS_PER_PAGE` drops from 24 to 20 across all PLP grids (`/search`, `/collections/[handle]`, `/collections/all`, and the markdown route mirrors).

## Why it matters

The grid uses `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` breakpoints. At the widest (xl, 5 cols) 24 leaves a 4-item dangling row; 20 fills the grid evenly at base (2), lg (4), and xl (5) and is only short at sm (3, two-item dangling). For an xl-first layout 20 reads cleaner.

## Apply when

Storefront still uses the template's default column breakpoints.

## Safe to skip when

Fork has retuned the grid to different breakpoints (e.g. always 3-col, or 6-col at xl). Pick a `RESULTS_PER_PAGE` that's a multiple of the widest column count.

## Validation

`pnpm --filter template dev`. Visit `/search`, `/collections/frontpage`, `/collections/all` at viewport widths matching each breakpoint and confirm the initial page fills evenly at lg/xl.
