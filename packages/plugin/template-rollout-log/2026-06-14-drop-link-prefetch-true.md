---
title: Drop prefetch={true} from product-card and nav <Link>s
changeKey: drop-link-prefetch-true
introducedOn: 2026-06-14
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/footer/index.tsx
  - apps/template/components/product-card/product-card.tsx
  - apps/template/components/nav/mobile-menu.tsx
  - apps/template/components/nav/quick-links.tsx
  - apps/template/components/collections/infinite-product-grid.tsx
---

## Summary

Removed `prefetch={true}` from the product-card and navigation `<Link>`s (footer, product card, mobile menu, quick links, infinite product grid). They now use Next's default `<Link>` prefetch (prefetch the static shell on viewport) instead of forcing a full-route prefetch.

## Why it matters

`prefetch={true}` prefetches the **full route** for every such link in the viewport — many product cards plus nav — which means a server render per link for routes that do request-time work (e.g. anything still on `prefetch = "allow-runtime"`). That was added to make client navigations skip the loading fallback.

It's no longer needed for the PDP: now that the product body is rendered into the **static shell** (see [`pdp-product-body-in-static-shell`](./2026-06-14-pdp-product-body-in-static-shell.md)), the default prefetch already pulls the shell — including the title/description/gallery — so client navs land on a populated page without forcing the heavier full-route prefetch and its server-invocation cost.

## Apply when

- You want to cut prefetch server load / cost from grids and nav, and your detail routes render their above-the-fold body into the static shell (so default prefetch is enough).

## Safe to skip when

- Your linked routes defer their main content to request time and you specifically want full-route prefetch so client navs skip the fallback — keep `prefetch={true}` there.

## Validation

1. `pnpm --filter template lint`.
2. Click through from a grid/nav into a PDP/collection and confirm the navigation still lands on populated content (the static shell), not a skeleton that lingers.
