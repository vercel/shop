# Product Detail Route Architecture

## Reference implementation

- Docs: [PDP anatomy](https://vercel.shop/docs/anatomy/pages/pdp), [Shopify PDP data](https://vercel.shop/docs/shopify/pdp)
- Route: `app/products/[handle]/page.tsx`
- Product detail components: `components/product-detail/`
- Product card and recommendations: `components/product-card/product-card.tsx`, `components/product/related-products-section.tsx`
- Cached reads: `lib/product/server.ts`
- Operations and transforms: `lib/shopify/operations/products/server.ts`, `lib/shopify/transforms/product/index.ts`, `lib/product/index.ts`
- Public source fallback: [PDP route source](https://github.com/vercel/shop/blob/main/app/products/%5Bhandle%5D/page.tsx), [product detail source](https://github.com/vercel/shop/tree/main/components/product-detail), [template source](https://github.com/vercel/shop)

## Preserve shell coherence

The PDP resolves `getProduct()` before rendering its body. Product identity, title, description, shared media, and other stable body content render together from the cached product.

Keep these coupled decisions together:

- keep `getProduct()` a cached `get*` read (`"use cache: remote"` with its `cacheLife` and tags);
- keep the route's only outer Suspense boundary around the params-dependent body, with `ProductDetailSkeleton` matching the resolved layout; do not add request-time boundaries around stable body content;
- keep `searchParams` unawaited for selected-option state;
- keep the selected-options promise separate from the variant promise, which can wait on Shopify — this route is the reference for the resolved-leaf shape in `rendering-architecture.md`;
- keep URL-selected variant resolution behind `searchParams`, which the root layout's `ensureStatic = "prefetch"` defers to navigation, so link prefetches never render per-variant data; the default variant comes from the cached product;
- answer the selection from the cached product when `variantsComplete` is true (`findListedVariant`); `getProduct()` loads up to 250 variants in one request. Query Shopify with `fetchProductVariant` only past 250 variants or for a combination the product lacks, and never paginate the list in the cached read;
- keep the sold-out shortcut narrow: past 250 variants, when the cached product has no variant for sale and its gallery is not partitioned by color, the page answers the selection from the variants that product already loaded (`findLoadedVariant`) and queries Shopify only for a combination it did not load, so a restock appears when the product cache refreshes.

Inspect the existing PDP boundaries before changing them. Render stable product content immediately where the data contract permits, then suspend only variant-dependent media, price, availability, option state, and purchase controls. Keep a broader boundary only when those concerns genuinely share one blocking dependency.

## Primary media

- Make the initially visible product image discoverable in the shell.
- Reserve the gallery's final geometry on mobile and desktop.
- Preload only the initially visible image when it is the LCP candidate.
- Keep thumbnails and off-screen gallery media lazy.
- Do not ship every image as eager or high-priority to hide gallery logic.
- Load lightbox code on demand when it is materially large; keep the server-rendered gallery usable without it.
- Use a stable poster for product video and defer playback work.

## Variant interaction

- Show the default or URL-selected option state without waiting for unrelated network work.
- Keep variant-dependent price, options, and purchase controls in one Hydrogen provider. Product copy, shared media, schema, and recommendations stay outside.
- Preserve optimistic add-to-cart behavior and exact variant availability.
- Reserve price and purchase-control space so variant resolution does not shift the page.
- Avoid serial work: selected-option parsing should not wait on the variant request, and recommendations should not block the buy section.

## Recommendations and secondary content

Stream recommendations independently below the product body with a grid-shaped fallback. Keep reviews, recommendations, and recently viewed sections out of the critical product path unless they determine the primary purchase UI.

Verify direct visits with and without selected-option query parameters, client option changes, back/forward navigation, unavailable variants, and products without media.
