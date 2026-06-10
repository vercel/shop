---
title: Home grid — source top catalog products instead of the frontpage collection
changeKey: home-products-all-catalog
introducedOn: 2026-06-10
changeType: refactor
defaultAction: review
appliesTo:
  - apps/template/app/page.tsx
  - apps/template/components/product/products-grid.tsx
  - apps/docs/content/docs/anatomy/pages/home.mdx
  - apps/docs/content/docs/reference/routes.mdx
paths:
  - apps/template/app/page.tsx
  - apps/template/components/product/products-grid.tsx
  - apps/docs/content/docs/anatomy/pages/home.mdx
  - apps/docs/content/docs/reference/routes.mdx
  - apps/docs/components/fake-browser/home-browser.tsx
---

## Summary

The home page product section previously read from Shopify's curated `frontpage` collection via `getCollectionProducts({ collection: "frontpage", limit: 8 })`, titled itself "Featured Products", and linked to `/collections/frontpage`. It now shows the top 8 products across the whole catalog, titled simply "Products", linking to `/collections/all`.

- `app/page.tsx`: the section is titled `"Products"` and its `collectionUrl` points at `/collections/all`. The `collectionHandle="frontpage"` prop is gone.
- `components/product/products-grid.tsx`: the exported `FeaturedProducts` component is renamed `ProductsGrid` (aligning the code with the name the docs already used) and now fetches through `getCatalogProducts({ limit, locale })` rather than `getCollectionProducts`. The `collectionHandle` prop is dropped; `title`, `limit`, `locale`, and optional `collectionUrl` remain. The shared `ProductsGridSkeleton` export is unchanged (still used by search and collections).
- With no query, `getCatalogProducts` resolves to `BEST_SELLING` order, so "top 8" means the eight best-selling products.
- Docs (`home.mdx`, `routes.mdx`) and the `HomeBrowser` doc mock are updated to match.

## Why it matters

- A fresh Shopify store has no `frontpage` collection populated by default, so the old home grid rendered empty until a merchant curated that collection. Sourcing from the full catalog gives every store a populated home page out of the box.
- The home grid and its "view all" link now point at the same place (`/collections/all`), so the section's data and its destination agree.

## Apply when

- The storefront has not deliberately curated its home page from the Shopify `frontpage` collection and wants the home grid populated from the catalog.
- The storefront wants the home grid, its heading, and its "view all" link to all reference the full catalog.

## Safe to skip when

- The storefront intentionally curates the home page via the `frontpage` collection in the Shopify admin. Keep `getCollectionProducts({ collection: "frontpage" })` and the `/collections/frontpage` link in that case.
- The storefront has its own merchandising rules for the home grid order (e.g. manual or seasonal) that `BEST_SELLING` would override.

## Notes

- Downstream code importing `FeaturedProducts` from `@/components/product/products-grid` must switch to `ProductsGrid` and drop the `collectionHandle` prop. `ProductsGridSkeleton` is unaffected.
- The `frontpage` collection is still fully supported by the data layer — this only changes the home page default. A storefront can pass any handle back through `getCollectionProducts` in a local `ProductsGrid` variant if it wants curation.

## Validation

1. `pnpm --filter template dev`.
2. Home page: the section heading reads "Products", shows up to 8 product cards, and the "View All" link navigates to `/collections/all`.
3. Confirm the grid populates on a store with no curated `frontpage` collection.
4. `pnpm --filter template lint` — no unused imports left from the dropped `getCollectionProducts` / `collectionHandle` references.
