---
title: Drop facet groups that resolve to a single value (filter transform)
changeKey: plp-drop-single-value-filter-groups
introducedOn: 2026-06-29
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/transforms/filters.ts
---

## Summary

`transformShopifyFilters` pruned zero-count *values* but still emitted facet *groups* that ended up with a single value. A one-option group offers no real choice — it renders as dead UI in the filter sidebar.

Two edits in `lib/shopify/transforms/filters.ts`:

1. Extracted the selection check into a small `isFilterValueSelected(activeFilters, paramKey, value)` helper, and reused it inside the existing zero-count value-pruning step (it previously inlined the same `Array.isArray(...) ? includes : ===` logic).
2. Added a final group-level filter after value pruning that drops any group with `values.length <= 1` **unless** its lone value is currently selected, so an active filter never silently disappears.

## Why it matters

Shopify returns facets like vendor/type/availability whose value list, after hiding zero-count entries for the current result set, often collapses to one. Rendering that group is pure clutter — the shopper can't narrow anything with it. Dropping it tidies the sidebar while the selected-value guard keeps active filters (and their clear-badge) visible even when they're the only remaining value in their group.

## Apply when

- The storefront uses `transformShopifyFilters` to build its collection/search facet UI (both `getCollectionProducts` and search pass `activeFilters`).

## Safe to skip when

- The storefront renders filters from a different transform, or deliberately wants to show single-value groups (e.g. to display the only available vendor as a static label).

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template exec tsc --noEmit`.
2. Open a collection where a facet resolves to one value — that group no longer renders.
3. Select that lone value via URL param (e.g. `?filter.p.vendor=Acme`) — the group stays visible and its active badge is shown.
