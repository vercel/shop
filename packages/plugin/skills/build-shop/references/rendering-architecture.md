# Storefront Rendering and Data Architecture

## Reference implementation

Inspect the source files listed in the skill's "Ground the work in source" step before applying the rules below. Prefer local files when this repository or a generated Vercel Shop project is available; otherwise fall back to [apps/template](https://github.com/vercel/shop/tree/main/apps/template).

## Keep responsibilities in layers

Vercel Shop enables `cacheComponents`, `partialPrefetching`, and the React Compiler. Keep route responsibilities separated:

| Layer | Owns | Must not own |
| --- | --- | --- |
| Route orchestration | URL identity, metadata, redirects, auth gates, real 404 decisions, promise orchestration | Interactive state or provider-specific presentation |
| Data operation | GraphQL, cache policy, tags, locale flow, transforms into domain types | React loading UI |
| Server composition | Static shell, section composition, Suspense placement | Browser effects or duplicated data fetching |
| Client island | Local interaction, optimistic UI, browser APIs | Initial public reads, secrets, or broad page composition |
| Server action | Mutation, authorization, invalidation, canonical result | Long-lived client state |

Do not call internal Route Handlers from Server Components. Call the operation directly so there is no avoidable HTTP hop. Do not let presentation import raw Shopify response types.

## Design the dependency graph

List each read and mark what it requires. A dependency should block another only when its output is an input to that work.

- Resolve route identity early when it is required to return a real 404, redirect, or coherent cached body.
- Create independent promises before awaiting any of them.
- Pass request APIs and derived promises downward until their smallest consumer.
- Use sibling Suspense boundaries when sections can resolve independently.
- Keep slow recommendations, facets, account state, or secondary marketing work off the primary path.
- Avoid a client fetch that repeats data already available to a Server Component.

A Suspense boundary exposes an async dependency; it does not remove it. If the primary heading or media is inside the slow boundary, the route remains architecturally blocked.

## Pass request-time work down to a resolved leaf

The request-time promise shape is the pattern most often written wrong. Verify it against `apps/template/app/products/[handle]/page.tsx` and `apps/template/components/product-detail/product-detail-section.tsx`; the distilled shape:

```tsx
// 1. Route: await the stable, cacheable read → static shell. Leave searchParams
//    UNAWAITED; derive request-time promises from it, split by cost, pass DOWN.
export default async function ProductPage({ params, searchParams }: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  const product = await getProduct({ handle, locale }); // cacheable → lives in the shell
  if (!product) notFound();

  // Cheap URL parse and the network variant query ride SEPARATE promises, so the
  // picker highlight never waits on the round-trip that only price + buy need.
  const selectedOptionsPromise = searchParams.then((sp) => resolveOptions(product, sp));
  const variantPromise = searchParams.then((sp) => getProductVariant({ handle, locale, sp }));

  return (
    <ProductDetailSection
      product={product} // stable props render immediately
      selectedOptionsPromise={selectedOptionsPromise}
      variantPromise={variantPromise}
    />
  );
}

// 2. Composition is a SYNCHRONOUS component. It only places boundaries — never awaits.
function ProductInfoArea({ product, variantPromise }: ProductInfoAreaProps) {
  return (
    <>
      <ProductTitle title={product.title} /> {/* stable — no Suspense */}
      <Suspense fallback={<div className="h-7" aria-hidden />}> {/* fallback matches resolved height */}
        <ResolvedProductPrice variantPromise={variantPromise} />
      </Suspense>
    </>
  );
}

// 3. The resolved leaf is ASYNC, awaits exactly ONE promise, and sits inside its own boundary.
async function ResolvedProductPrice({ variantPromise }: { variantPromise: Promise<ProductVariant | undefined> }) {
  const variant = await variantPromise;
  return <ProductPrice amount={variant?.price} />;
}
```

Invariants the shape enforces:

- Await stable, cacheable reads at the route so they enter the shell; never `await searchParams` (or any request input) at the route.
- Promises flow through synchronous composition untouched. Only a resolved leaf awaits, and it awaits one promise — so a slow read suspends only its own leaf, not its siblings.
- Every resolved leaf has its own `Suspense` whose fallback matches the resolved geometry, so streaming does not shift the shell.
- Split one request input into multiple promises when their costs differ, so cheap UI never waits on a network round-trip it does not need.

## Choose cache ownership deliberately

| Data | Default treatment |
| --- | --- |
| Public content that belongs in the prerendered shell | Plain `"use cache"` with the existing `cacheLife` and `cacheTag` policy |
| Public results resolved after request inputs such as filters or search params | `"use cache: remote"` when a shared runtime cache is justified |
| Customer, session, cart, or authorization-dependent data | Uncached or private per-session handling; never place it in a shared remote cache |
| Mutation results | Preserve the domain invalidation path; every cart mutation must call `invalidateCartCache()` |

Keep cache directives in the data layer. Do not add a second cache in presentation code.

Plain `"use cache"` and `"use cache: remote"` are not interchangeable. Plain cacheable reads can be included in a static shell. Remote cached reads are useful after request-time inputs but may resolve outside that shell. Changing the directive can change route coherence even when the returned data is identical.

## Shape the shell and streaming boundaries

- Put stable navigation, headings, primary copy, primary media, and other likely LCP candidates in the shell when their data is cacheable.
- Keep `notFound()` and redirects ahead of streaming when the HTTP status matters.
- Match fallback width, height, aspect ratio, and spacing to resolved content.
- Preserve useful content during transitions instead of replacing the whole page with a spinner.
- Keep unrelated sections in sibling boundaries rather than nesting them behind one request.
- Do not wrap content in Suspense merely because its component is async.

An outer route fallback is appropriate when the route truly has no useful shell. Otherwise, push the boundary inward until only request-dependent UI suspends.

## Define client and mutation boundaries

- Keep pages, layouts, data fetchers, grids, cards, prices, and static media as Server Components.
- Isolate search dialogs, filters, variant controls, cart controls, galleries, and forms into leaf client components.
- Pass primitives or narrow serializable view models rather than complete domain objects.
- Keep optimistic state close to the mutation it predicts, then reconcile with the canonical server result.
- Invalidate only the affected domain data. Preserve `invalidateCartCache()` for every cart mutation.
- Lazy-load expensive closed overlays or optional tools, but do not lazy-load primary content to improve a bundle report.

## Architect media and third parties

- Use `next/image`; reserve space with intrinsic dimensions or an aspect-ratio container.
- Supply `sizes` for responsive and `fill` images based on actual layout breakpoints.
- Preload only the clear LCP image. Keep product grids and off-screen gallery media lazy.
- Keep the LCP resource discoverable in initial server output, not behind a client effect.
- Use `next/font` and load only required families, subsets, styles, and weights.
- Use `next/script` or maintained Next.js integrations. Keep non-critical third parties off the initial execution path.
- Server-render a lightweight video poster and avoid making playback code block primary content.

## Treat navigation as part of the architecture

With partial prefetching, visible links receive a reusable App Shell by default. `prefetch={true}` requests more cached destination content. A route exporting `prefetch = "allow-runtime"` can cause a server invocation for each eligible link.

- Leave low-intent or high-fanout links at the default.
- Consider fuller prefetching for a small number of high-intent links.
- Use runtime prefetching only when it resolves meaningful request-dependent UI before the click.
- Pair runtime prefetching with instant-navigation validation where supported.
- Verify request count and navigation behavior with the tools available in the current environment. Use a production build only when prefetch or deployment behavior is explicitly under investigation.

Prefetch cannot compensate for a route whose primary content is unnecessarily request-bound.

## Verify the complete flow

Check cold direct visits, prefetched navigations, mutations, and back/forward navigation. Confirm:

- the shell paints without waiting for non-critical Shopify work;
- the primary resource starts early and is not duplicated;
- independent sections stream independently;
- fallbacks do not move surrounding content;
- interactions do not require hydrating unrelated page regions;
- no hydration, uncached-data, or blocking-route errors appear;
- mutations invalidate and reconcile the intended data only.

Use lab tools to diagnose architectural mistakes. Consult field data only when explicitly evaluating deployed user performance and the data is available.
