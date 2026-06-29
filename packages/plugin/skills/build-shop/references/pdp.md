# Product Detail Route Architecture

## Reference implementation

- Docs: [PDP anatomy](https://vercel.shop/docs/anatomy/pages/pdp), [Shopify PDP data](https://vercel.shop/docs/shopify/pdp)
- Route: `apps/template/app/products/[handle]/page.tsx`
- Product detail components: `apps/template/components/product-detail/`
- Product card and recommendations: `apps/template/components/product-card/product-card.tsx`, `apps/template/components/product/related-products-section.tsx`
- Operations and transforms: `apps/template/lib/shopify/operations/products.ts`, `apps/template/lib/shopify/transforms/product.ts`, `apps/template/lib/product.ts`, `apps/template/lib/shopify/encoded-variants.ts`
- Public source fallback: [PDP route source](https://github.com/vercel/shop/blob/main/apps/template/app/products/%5Bhandle%5D/page.tsx), [product detail source](https://github.com/vercel/shop/tree/main/apps/template/components/product-detail), [template source](https://github.com/vercel/shop/tree/main/apps/template)

## Preserve shell coherence

The PDP deliberately resolves `getProduct()` before rendering. Product identity, title, description, shared media, and other stable body content are baked into one static shell.

Keep these coupled decisions together:

- keep `getProduct()` on plain `"use cache"`;
- keep the stable product body out of a request-time outer Suspense boundary;
- do not add `prefetch = "allow-runtime"` to the PDP without proving that the body is not rendered again as a divergent request-time flight;
- keep `searchParams` unawaited for selected-option state;
- keep the selected-options promise separate from the slower exact-variant query.

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
- Keep option controls as a small client island. Product copy, shared media, schema, and recommendations do not need to enter that boundary.
- Preserve optimistic add-to-cart behavior and exact variant availability.
- Reserve price and purchase-control space so variant resolution does not shift the page.
- Avoid serial work: selected-option parsing should not wait on the variant request, and recommendations should not block the buy section.

## Recommendations and secondary content

Stream recommendations independently below the product body with a grid-shaped fallback. Keep reviews, recommendations, and recently viewed sections out of the critical product path unless they determine the primary purchase UI.

Verify direct visits with and without selected-option query parameters, client option changes, back/forward navigation, unavailable variants, and products without media.
