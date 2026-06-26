---
name: build-storefront
description: Build Vercel Shop storefront routes so data loading, caching, streaming, navigation, mutations, and client interaction remain non-blocking and coherent. Use when creating, redesigning, refactoring, or reviewing the home page, product and collection pages, search, cart, account, navigation, product cards, media, loading states, or cross-route behavior; also use for decisions involving Cache Components, Suspense, Shopify data ownership, cache scope, invalidation, prefetching, Server and Client Component boundaries, layout stability, or rendering performance.
---

# Build a Storefront

Design the route dependency graph before designing its presentation. Performance is an architectural outcome of where data is owned, when work starts, what blocks the shell, and how little code must run in the browser.

## Start with the existing contract

1. Read the project's `AGENTS.md`, the target route, its view contract, and every operation it calls.
2. Read the local Next.js documentation under `node_modules/next/dist/docs/` for any API being changed. This template may use newer Cache Components and prefetch behavior than model knowledge.
3. Preserve existing cache directives, promises, invalidation tags, auth gates, redirects, metadata, and `notFound()` behavior unless the task explicitly changes the domain behavior.
4. Read `references/rendering-architecture.md` for every route. Then read only the route references that apply:
   - Commerce behavior and end-to-end flows: `references/commerce-flows.md`
   - Home and marketing routes: `references/home.md`
   - Collection and search routes: `references/plp-search.md`
   - Product routes: `references/pdp.md`
   - Cart and authenticated account routes: `references/cart-account.md`
   - Cart provider, bootstrap, optimistic state, and mutations: `references/cart-provider.md`

## Model the route

Write down the route as five layers before editing:

1. **Route orchestration** — resolve identity needed for redirects, metadata, auth, and real 404s.
2. **Data operations** — fetch Shopify data, transform provider types, and own cache policy and tags.
3. **Server composition** — render stable shell content and place independent async sections behind granular boundaries.
4. **Client islands** — own only state, effects, browser APIs, and event handlers.
5. **Mutation path** — perform server mutations, invalidate the right domain cache, and reconcile optimistic state.

For every dependency, classify it as cacheable shell content, request-time shared content, request-time personalized content, or client-only state. Draw an edge only when one result genuinely requires another. Start all other work concurrently.

## Keep the Shopify boundary explicit

Use the installed Shopify AI Toolkit for Shopify API documentation, schema facts, operation design, and validation. Invoke its API-specific skill before adding or changing Storefront or Customer Account GraphQL. For metafields or metaobjects, use its custom-data skill first.

Use `/vercel-shop:shopify-graphql-reference` only after Shopify validation to apply Vercel Shop conventions: operation placement, domain transforms, cache role, locale flow, invalidation, and route integration. Never treat this architecture skill as a substitute for authoritative Shopify validation.

## Prevent blocking

1. Keep stable headings, primary media, and likely LCP content in the static shell when the data contract permits it.
2. Resolve route identity early only when it is required for correctness or shell coherence.
3. Pass request-dependent promises downward unawaited. Resolve them in the smallest component that needs them and place Suspense there.
4. Use sibling boundaries for independent work. Do not put the whole page behind the slowest Shopify request.
5. Give every visible fallback the same outer geometry as its resolved content.
6. Keep components server-rendered by default. Do not move reads into client effects or internal HTTP endpoints.
7. Keep cache policy in the data layer and personalized data out of shared caches.
8. Treat prefetching as a traffic-versus-latency decision, not a default fix for blocking architecture.

## Verify the architecture

Run the static hotspot scan from the skill directory:

```bash
node scripts/audit-storefront.mjs <storefront-root>
```

Treat its output as review prompts, not measurements. Then:

1. Run targeted lint, typecheck, tests, and affected flows available in the current environment.
2. Test direct visits and client navigations for the routes changed.
3. Verify that non-critical Shopify work does not delay the shell or primary interaction.
4. Run every affected flow in `references/commerce-flows.md`, including failure and empty states.
5. Inspect failed requests, layout shifts, LCP discovery, hydration, and interaction behavior when relevant.
6. Require a production build only when build, prerendering, caching, bundling, deployment behavior, or release readiness is in scope.
7. Use bundle analysis or deployed field data only for an explicit performance investigation when those tools and data are available. Do not request them as routine completion work or claim measured improvement from code inspection.

Report the final layer boundaries, blocking dependencies, cache ownership, and remaining risks.
