# Home and Marketing Route Architecture

## Reference implementation

- Docs: [home page anatomy](https://vercel.shop/docs/anatomy/pages/home)
- Source: `apps/template/app/page.tsx`
- Product sections: `apps/template/components/product/products-grid.tsx`, `apps/template/components/product/products-slider.tsx`, `apps/template/components/product-card/product-card.tsx`
- Catalog operations: `apps/template/lib/shopify/operations/collections.ts`, `apps/template/lib/shopify/operations/products.ts`
- Public source fallback: [home route source](https://github.com/vercel/shop/blob/main/apps/template/app/page.tsx), [template source](https://github.com/vercel/shop/tree/main/apps/template)

## Rendering contract

Keep brand copy and the primary heading available in the initial shell. The catalog promise may stream, but the visual design should not require the product request before any meaningful home content can paint.

Inspect how the route starts its catalog and marketing reads. Preserve useful promise boundaries or replace them with smaller equivalent boundaries; do not convert server-owned catalog data into a client fetch.

## Hero and LCP

- Decide whether the LCP candidate is text, an image, or a video poster before choosing the hero implementation.
- Keep primary copy outside the catalog boundary.
- For a hero image, reserve its aspect ratio, provide truthful responsive `sizes`, and preload it only when it is the clear LCP candidate.
- For a video hero, server-render a poster and copy first. Load playback code and video bytes without blocking the initial image and text.
- Avoid competing eager hero, logo, and first-grid image requests.

## Product sections

- Start independent section reads together.
- Stream sections independently when one slow collection should not block the others.
- Render product-card text and images on the server; isolate wishlist, quick-add, or slideshow behavior.
- Keep initial result counts bounded. Infinite scrolling must not force the initial page to ship the client state or data for every later page.
- Do not preload an entire first row. Let non-LCP card images remain lazy unless production evidence supports a narrowly targeted exception.

## Marketing content

- Prefer static or cached server content for editorial sections.
- Lazy-load embeds, reviews, maps, and other third-party widgets below the fold.
- Reserve space for asynchronously loaded campaigns and personalization so they do not move the page.
