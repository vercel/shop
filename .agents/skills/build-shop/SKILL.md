---
name: build-shop
description: Build or adapt Vercel Shop storefront routes, in the template or a storefront applying its patterns outside the template. Use for route-level data, rendering, caching, streaming, prefetch, navigation, and storefront reviews or audits. Feature setup belongs to the `enable-analytics`, `enable-i18n`, `enable-shopify-markets`, and `enable-shopify-menus` skills; GraphQL authoring belongs to `shopify-graphql-reference`.
---

# Build with Vercel Shop

Build the shop around commerce truth first: what product or collection is being shown, what the customer has selected, what can be bought now, what price is authoritative, and what state belongs in the URL, Shopify, the server cache, or the browser. Use the Vercel Shop template as the reference implementation, but adapt the behavior to the current storefront instead of copying files blindly.

## Ground the work in source

1. Read the project's `AGENTS.md` for ownership, invariants, `lib/` layout, import boundaries, and code style. Then read the target route, its view contract, and every operation it calls.
2. Inspect the template source when it is available:
   - Route and layout shell: `app/layout.tsx`, `app/page.tsx`
   - Shopify boundary: `lib/shopify/storefront/server.ts`, `lib/shopify/operations/`, `lib/shopify/transforms/`, `lib/product/types.ts`, `lib/customer/types.ts`
   - Next.js cache boundary: the cached `get*` wrappers in `lib/<domain>/server.ts` around the uncached `fetch*` operations
   - Shared layout primitives: `components/ui/container.tsx`, `components/ui/page.tsx`, `components/ui/sections.tsx`
   - Public source: [template source](https://github.com/vercel/shop)
3. Read the installed Next.js documentation under `node_modules/next/dist/docs/` for any API being changed; this template may use newer Cache Components and prefetch behavior than model knowledge. [llms.txt](https://vercel.shop/llms.txt) indexes the route, Shopify, and API boundary docs.
4. Preserve existing cache directives, promises, invalidation tags, auth gates, redirects, metadata, and `notFound()` behavior unless the task explicitly changes the domain behavior.

## Hydrogen ownership

The template uses the framework-agnostic Hydrogen preview SDK, not Hydrogen's React Router application framework. Next.js owns routing, rendering, public-data caching, and invalidation. Hydrogen owns commerce state and protocols; the template supplies presentation and framework adapters. Use Hydrogen's cart provider, forms, and handlers rather than rebuilding cart state or hydration. Cart types are handler-derived; catalog and account presentation read domain transforms. Read the installed SDK guidance and verify adapter behavior before changing these boundaries.

## Copy and locale defaults

Copy is inline and server-first, with reusable content functions in `lib/content/index.ts`. `shopConfig.localization` sets `{ country: "US", language: "EN", locale: "en-US" }`: country and language scope commerce requests, `locale` formats output, and currency comes from Shopify responses. Use `enable-i18n` for copy or routing and `enable-shopify-markets` for regional commerce; preserve an upgraded installation's next-intl catalogs, localized routes, and custom commerce behavior.

## Shop Agent boundaries

Shop Agent, customer authentication, and BotID are disabled by default; unrelated work must not enable them implicitly.

Eve owns `/eve/v1/*`, and Next.js prepares the browser cart through `/api/agent/session`. Tool schemas and execution belong in `agent/tools/`, shared execution helpers in `agent/lib/`, and browser state, presentation helpers, and shared result types in `lib/agent/`. Keep Next.js request and cache APIs out of Eve's runtime imports, preserve the `withEve` deployment and the conditional plugin list passed to `withShopConfig` in `next.config.ts`, and let Hydrogen reconcile assistant cart writes.

## Route the work

Read `references/rendering-architecture.md` before changing cache ownership, data dependencies, Suspense placement, rendering mode, or prefetch behavior; its responsibility and cache-role tables are canonical. Write down the route's five layers from the responsibility table before editing, using commerce nouns for its data and state. Then read only the references that apply:

- Commerce behavior and end-to-end flows: `references/commerce-flows.md`
- Home and marketing routes: `references/home.md`
- Collection and search routes: `references/plp-search.md`
- Product routes: `references/pdp.md`
- Cart and authenticated account routes: `references/cart-account.md`
- Cart provider, bootstrap, optimistic state, and mutations: `references/cart-provider.md`

## Storefront gotchas

- Product selection must round-trip through direct visits, links, refreshes, and client navigation, then drive media, price, availability, add-to-cart payloads, and canonical links.
- Collection/search URLs are the source of truth for browsing. Empty results, unavailable facets, and back/forward navigation are not optional states.
- Cart UI must keep confirmed Shopify state separate from pending optimistic intent so concurrent mutations, bootstrap, errors, and warnings cannot double-apply or disappear.
- Customer, account, cart identity, and authorization state must never leak into shared product, collection, menu, page, or recommendation caches.
- Missing images, deleted products, sold-out variants, empty collections, partial Shopify failures, and disabled auth are normal storefront cases. Represent them deliberately.

## Keep the Shopify boundary explicit

Use the installed Shopify AI Toolkit for Shopify API documentation, schema facts, operation design, and validation. Invoke its API-specific skill before adding or changing Storefront or Customer Account GraphQL, and its custom-data skill first for metafields or metaobjects.

Use `shopify-graphql-reference` after Shopify validation for Vercel Shop conventions: operation placement, domain transforms, cache role, locale flow, invalidation, and route integration. This architecture skill never substitutes for Shopify validation.

Shopify returns rich text (`body`, `contentHtml`, `descriptionHtml`) as staff and apps saved it. Pass it through `sanitizeShopifyHtml` from `lib/shopify/html/server.ts` in the `fetch*` operation that returns it, and render it only under an `oxlint-disable-next-line react/no-danger` directive that names the sanitizer, such as `-- Product descriptions pass through sanitizeShopifyHtml when fetched.`

## Verify the architecture

Run the static hotspot scan from the skill directory and treat its output as review prompts, not measurements:

```bash
node scripts/audit-storefront.mjs <storefront-root>
```

Then:

1. Run the project's check command (`pnpm check` in the template: lint, format, typecheck), plus the targeted tests and flows available in the current environment.
2. Test direct visits, client navigation, back/forward navigation, and URL round-trips for the routes changed, and run every affected flow in `references/commerce-flows.md`, including failure, empty, sold-out, and missing-media states.
3. Confirm non-critical Shopify work does not delay the shell, primary media, selected price or availability, or the primary interaction.
4. Inspect failed requests, layout shifts, LCP discovery, hydration, and interaction behavior when relevant.
5. Require a production build only when build, prerendering, caching, bundling, deployment behavior, or release readiness is in scope.

Report the final layer boundaries, blocking dependencies, cache ownership, and remaining risks.
