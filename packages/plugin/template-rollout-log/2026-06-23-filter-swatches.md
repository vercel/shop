---
title: Render SWATCH-presentation filters as a swatch grid (color/image)
changeKey: filter-swatches
introducedOn: 2026-06-23
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/types/filters.ts
  - apps/template/lib/types.ts
  - apps/template/lib/shopify/transforms/filters.ts
  - apps/template/components/ui/swatch.tsx
  - apps/template/components/collections/filter-primitives.tsx
  - apps/template/components/collections/filter-sidebar.tsx
  - apps/docs/content/docs/anatomy/pages/plp.mdx
---

## Summary

Collection/search filters whose Shopify `presentation` is `SWATCH` (typically Color) now render as a grid of color/image swatches instead of the text checkbox list. All other filters are unchanged.

The data already existed in the Storefront API but wasn't captured. The change threads it end to end:

- **Query** (`lib/shopify/operations/products.ts`): both filter selections (`searchFacets` `productFilters` and the collection `filters`) now request `presentation` and, per value, `swatch { color image { previewImage { url } } }`.
- **Shopify types** (`lib/shopify/types/filters.ts`): new `ShopifyFilterPresentation` (`IMAGE | SWATCH | TEXT`) and `ShopifyFilterSwatch`; `presentation` added to `ShopifyFilter`, `swatch` to `ShopifyFilterValue`.
- **Domain types** (`lib/types.ts`): new `FilterPresentation` (`image | swatch | text`); `Filter.presentation` and `FilterValue.swatch` added. `swatch` reuses the existing `OptionValueSwatch { color?, image? }` shape (same type the PDP option swatches use).
- **Transform** (`lib/shopify/transforms/filters.ts`): `mapShopifyFilterPresentation` (uppercase → lowercase) and `transformFilterSwatch` (mirrors `transformSwatch` in `transforms/product.ts`).
- **Component** (`components/ui/swatch.tsx`): new presentational `Swatch` primitive — primitive props only (`color?`, `image?`, `label`, `selected?`), mirrors the PDP `ColorPicker` visual (image-precedence, color fallback, selected ring).
- **Wiring** (`components/collections/filter-{primitives,sidebar}.tsx`): new `FilterSwatchGrid` layout; the sidebar branches on `filter.presentation === "swatch"` to render the swatch grid (reusing the existing `toggleFilter` / `computeFilterHref` / optimistic-selection handlers), else the existing `FilterOptionList`.

The swatch grid renders **all** values (no cap), since swatches are compact. The text-list branch keeps its existing `.slice(0, 10)`.

## Why it matters

- Color (and other swatch) filters are far more usable as visual swatches than as a text list — matching how Shopify's own Search & Discovery presents them and how the PDP already shows variant colors.
- The fields come straight from the Storefront API, so no Shopify configuration beyond enabling a swatch-presentation filter (Search & Discovery → Filters) is required.

## Apply when

- Your storefront uses the template's collection/search filter sidebar and has Color (or other `SWATCH`-presentation) filters configured in Shopify Search & Discovery.

## Safe to skip when

- Your catalog has no swatch-presentation filters, or you prefer a text-only filter list. With no `SWATCH` filters the change is inert (everything renders as before).

## Notes

- Only `swatch` is handled. `IMAGE`-presentation filters (top-level `FilterValue.image`) still fall through to the text list — a possible follow-up.
- The PDP `ColorPicker` was left as-is; refactoring it onto the new `Swatch` primitive is a possible follow-up.

## Validation

1. `pnpm --filter template codegen` — confirms `presentation` / `swatch { color image { previewImage { url } } }` exist on the live Storefront schema (the build gate also runs it).
2. `pnpm --filter template lint`, `pnpm --filter template build`, `pnpm --filter docs build`.
3. On a store with a `SWATCH` Color filter (e.g. the `vpparel` preview store), open `/collections/all`: the Color filter renders as a swatch grid with correct hex/image swatches, selecting one filters results and shows the selected ring, and non-swatch filters (Size, etc.) remain the text list. Note the default local dev store may not have swatch-presentation filters configured.
