# Shared Shell and Rendering Contract

## Preserve the architecture

Vercel Shop enables `cacheComponents`, `partialPrefetching`, and the React Compiler. Route files deliberately separate cacheable identity/content from request-time inputs. Rebuild presentation inside those boundaries before changing the boundaries themselves.

Do not move Shopify reads into client effects or internal Route Handlers. Fetch in Server Components or server modules and pass data or promises downward.

## Choose the cache deliberately

| Data | Default treatment |
| --- | --- |
| Public content that belongs in the prerendered shell | Plain `"use cache"` with the existing `cacheLife` and `cacheTag` policy |
| Public results resolved after request inputs such as filters or search params | `"use cache: remote"` when a shared runtime cache is justified |
| Customer, session, cart, or authorization-dependent data | Uncached or private per-session handling; never place it in a shared remote cache |
| Mutation results | Preserve the domain invalidation path; every cart mutation must call `invalidateCartCache()` |

Keep cache directives in the data layer. Do not add a second caching layer in presentation code. Preserve Shopify webhook tags so content freshness remains coherent with the shell.

Plain `"use cache"` and `"use cache: remote"` are not interchangeable. In this template, plain cacheable reads can be included in a static shell. Remote cached reads are useful after request-time inputs but may resolve outside that shell. Changing the directive can change rendering behavior even when the returned data is identical.

## Shape Suspense around user-visible work

- Keep stable LCP candidates outside slow boundaries when possible.
- Pass `params`, `searchParams`, cookies, or derived promises unawaited until the smallest request-dependent section when the route contract already does so.
- Resolve cacheable route identity early when it is required for a real 404 and belongs in the shell.
- Use sibling boundaries for independent work. Avoid one boundary that makes a fast section wait for the slowest request.
- Match fallback width, height, aspect ratio, and surrounding spacing to the resolved section.
- Keep `notFound()` and redirects ahead of streaming when the real HTTP status matters.

Suspense is not automatically faster. A boundary around content that already belongs in the shell can delay LCP, duplicate request-time rendering, or create a shell/flight coherence problem.

## Control client JavaScript

- Keep pages, layouts, data fetchers, grids, cards, prices, and static media as Server Components unless interaction requires a client boundary.
- Isolate search dialogs, filters, variant controls, cart controls, galleries, and other stateful behavior into leaf client components.
- Pass primitives or narrow serializable view models rather than complete Shopify responses.
- Lazy-load expensive non-critical overlays or tools. Do not lazy-load primary content solely to reduce a bundle report.
- Prefer CSS for responsive layout, hover/focus presentation, and simple transitions.
- Re-run the Next.js bundle analyzer after adding a substantial client dependency or expanding a `"use client"` boundary.

## Load media and third parties intentionally

- Use `next/image`; reserve image space with intrinsic dimensions or an aspect-ratio container.
- Supply `sizes` for responsive and `fill` images. Model the actual breakpoints rather than defaulting every image to `100vw`.
- In current Next.js versions, use `preload` for the single clear LCP image. Prefer `loading="eager"` or `fetchPriority="high"` when preloading is not appropriate. Do not eagerly load a product grid.
- Keep the LCP image discoverable in the initial server output. A client effect or late Suspense boundary defeats image priority.
- Use `next/font` for storefront fonts and load only required families, subsets, styles, and weights.
- Use `next/script` or the maintained Next.js integration for third parties. Default non-critical scripts to post-interactive or idle loading.
- Keep video posters lightweight, pause off-screen playback, and avoid making autoplay video the only LCP representation.

## Tune prefetching with production evidence

With partial prefetching, visible links receive a reusable App Shell by default. `prefetch={true}` requests more cached destination content. A route exporting `prefetch = "allow-runtime"` can cause a server invocation for each eligible link.

- Leave low-intent or high-fanout links at the default.
- Consider fuller prefetching for a small number of high-intent navigation links.
- Use runtime prefetching only when it resolves meaningful request-dependent UI before the click.
- Pair runtime prefetching with the route's instant-navigation validation where supported.
- Verify prefetch request count and navigation behavior in a production build.

## Verify outcomes

Check both cold direct visits and warm client navigations. Under throttling, confirm:

- the shell paints without waiting for non-critical Shopify work;
- the LCP resource starts early and is not duplicated;
- fallbacks do not move surrounding content when they resolve;
- filters, options, cart controls, and dialogs respond without long main-thread stalls;
- no hydration, uncached-data, or blocking-route errors appear;
- cached content refreshes after the existing invalidation path.

Use lab tools to diagnose. Use Speed Insights field data to decide whether users improved.
