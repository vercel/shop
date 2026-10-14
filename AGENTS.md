# Vercel Shop

Vercel Shop is a Next.js storefront for Shopify, deployed to Vercel, with agent skills in `.agents/skills/`.

## Three owners

Every feature belongs to exactly one owner. If a change cannot name its owner, or reaches into another owner's territory, redesign it. Place new work by owner first, then by domain. Docs and skills describe the product in these terms.

**Shopify owns commerce** through the framework-agnostic Hydrogen preview SDK, not the Hydrogen React Router framework.

- Owns: Storefront and Customer Account API clients, catalog, cart state and mutations, checkout, predictive search, Customer Account OAuth and sessions, policies, Shopify analytics.
- Lives in: `lib/shopify/**`, `lib/cart/**`, `lib/auth/server.ts`, the handlers registered in `proxy.ts`, and `lib/<domain>/types.ts` for the domain models transforms produce.
- Must not be reimplemented: prices, availability, currency, cart totals, and customer identity always come from Shopify responses.

**Next.js owns the app.**

- Owns: routing and clean URLs, Server Components, caching and tag invalidation, metadata and SEO, Suspense and loading geometry, the request boundary that adapts Hydrogen's handlers, and the answer-engine surface: `text/markdown` negotiation, Markdown representations, `/llms.txt`, Schema.org data, sitemap, and robots.
- Lives in: `app/`, `components/`, `lib/<domain>/{index,server,client,action}.ts`, `lib/config/`, `next.config.ts`, `proxy.ts`; the answer-engine surface in `lib/markdown/**`, `lib/seo/**`, `app/md/**`, `app/llms.txt/`, `app/sitemap*`, `app/robots.ts`, `components/schema/`.
- Must not: mutate the cart through Server Actions, refresh tokens in Server Components, invalidate public caches for cart changes, or reach into `agent/`.

**Eve owns the agent.**

- Owns: sessions, channels, tools, connections, instructions, model selection, `/eve/v1/*`.
- Lives in: `agent/` (tools in `agent/tools/`, shared execution helpers in `agent/lib/`), `lib/agent/`, `components/agent/`, and `app/api/agent/session`, the only Next.js route Eve needs; it prepares the browser cart.
- Must not: import Next.js request or cache APIs, add a second tool-name dispatcher, recreate a chat API route, or let model arguments select the cart.

## Describe the product, not the change

- Code, comments, docs, skills, commits, and pull requests describe current behavior, not the work that produced it.
- Pull requests are terse: what the shopper, merchant, or agent can now do, which owner it belongs to, and how it was verified.
- Docs add a detail only when a reader needs it to act or decide.
- Names and file placement carry the architecture. If a reader needs prose to find a module's owner, fix the name or location.

## Boundary rules

1. **Commerce facts come from Shopify.** Never map locale to currency, hand-write Shopify response types, or guess schema fields.
2. **Cart writes go through Hydrogen handlers.** `proxy.ts` serves `/api/cart`; components use `useProductForm` and `useCartForm`; Eve cart tools call the handlers with the cart bound from the browser cookie. No Server Actions or cache-tag invalidation for carts.
3. **Shopify fetches, Next.js caches.** `lib/shopify/operations/**/server.ts` exports uncached `fetch*` operations and never imports `next/cache`. `lib/<domain>/server.ts` exports `get*` wrappers that own `"use cache"`, `cacheLife`, and `cacheTag`. Pages call `get*`; Eve tools call `fetch*`. Of browse results, only the default first page of a collection and of `/collections/all` is cached, through `getCollectionResults` and `getAllProductsResults` with `cacheLife("minutes")` and webhook tags. Filtered and sorted browse, Load more pages, search results, and their facets call `fetch*`: cached cursor pages drift apart and duplicate products, and Search & Discovery edits send no webhook.
4. **Server Components read auth; they never refresh it.** Use `isCustomerLoggedIn()` for UI state, `requireCustomerSession()` for route gates, and `requireCustomerAccessToken()` immediately before Customer Account API calls.
5. **`components/ui/` takes primitive props only.** No domain types, SDK types, or content helpers; wrappers in `components/<domain>/` supply labels and data.
6. **Copy is inline and server-first.** Keep labels beside their component; reusable content functionality goes in `lib/content/index.ts`, not a string catalog. Pass primitive labels to client leaves, never content functions. Do not add a `t()` runtime or next-intl to the default storefront; an already localized installation keeps next-intl, aligned catalogs, and narrowly scoped `NextIntlClientProvider` boundaries.
7. **Two outward-facing agent surfaces, two owners.** Next.js describes the storefront through Markdown, `/llms.txt`, structured data, and the sitemap, built from the same domain types as the HTML pages. Shopify's agent endpoints (`/api/mcp`, `/api/ucp/mcp`, `/.well-known/ucp`) are Shopify's; `proxy.ts` only forwards them. Do not reimplement either side in the other, or route Eve through the Markdown surface.
8. **Every user-configurable `process.env.X` read has a row in `.env.example`** with a short comment on when to set it, and every `process.env.X` read is listed in `turbo.json` `globalEnv`; Turborepo's strict mode hides undeclared variables and leaves them out of cache keys.

Agent folders hold only `.agents/skills/` and its `.claude/skills` symlink; edit skills only in `.agents/skills/`. Refer to skills by plain name, such as `enable-shopify-markets`. `shopify-ai-toolkit` is separate external tooling that Shop skills do not install.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Shopify layer

Read the installed Hydrogen README and bundled skills before changing an SDK integration. Do not apply React Router loaders, actions, or Oxygen setup.

- Presentation uses domain models, never raw Shopify responses.
- `storefront.request` injects `$country`/`$language` from its optional `locale: { country, language }` commerce context, defaulting to `shopConfig.localization`; this is not the formatting locale string.

### GraphQL

- Use the API-specific `shopify-ai-toolkit` skill for API facts and validation before adding or changing a document, then `shopify-graphql-reference` for placement. Without it, use official Shopify documentation and validation tooling; never guess.
- Write documents with `gql()` from `@shopify/hydrogen` or `@shopify/hydrogen/customer-account`, compose fragments through its second argument, and derive response types with `ResultOf<typeof DOC>`. Keep the `#graphql` or `/* GraphQL */` marker.
- Type inference is not schema validation. Do not run `hydrogen gql check`; it needs the TypeScript compiler API, which TypeScript 7 does not ship. Do not add repo-local schema snapshots.

### Cart

- `seedCartData` shares a per-request promise, not a data-cache entry. Keep carts out of public caches.
- `prepareCheckoutAction` reads the confirmed checkout URL; it does not mutate the cart.
- `lib/cart/types.ts` derives cart types from Hydrogen's handlers, the deliberate exception to domain types. Cart integration components may use Hydrogen store and form types; `components/ui/` may not.

### Customer accounts

Opt-in through `shopConfig.auth.isEnabled`, read directly in server and client code. Enabling it requires `CUSTOMER_ACCOUNT_SESSION_SECRET`, an app-generated secret that is not the Shopify client secret, plus `SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID` and `SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET`; all three are server-only.

- Token refresh happens only where Hydrogen can commit cookies: `requireCustomerAccessToken()` redirects refreshable sessions through `/account/refresh`.
- `components/nav/account.tsx` reads session state inside Suspense with a fixed `size-5` icon container.
- Sign-out is a same-origin POST so Hydrogen can clear the session and perform Shopify RP-initiated logout.

## Next.js layer

- Preserve route-level data loading, promise boundaries, cache directives, invalidation tags, metadata, redirects, and auth gates when rebuilding presentation unless the task changes behavior.
- Start independent work together; block rendering only where one result needs another.
- Keep stable headings, primary media, and likely LCP content in the static shell. Push request-time inputs to the smallest Suspense boundary that needs them, with fallbacks that match the resolved geometry.
- Routes with runtime params (products, collections, blogs, articles, pages, policies) render a synchronous page that wraps the async content in `Suspense` with a route skeleton. Do not use `loading.tsx`, which serializes the skeleton twice in every document's RSC payload, or `export const instant = false`. Export the skeleton beside the component it mirrors and mark its root `aria-busy="true"`.
- The default view of a collection and of `/collections/all` ships its cached products in the static shell and per-link prefetches; `proxy.ts` rewrites filtered and sorted URLs to the request-time `refine` route beside it and returns 404 for direct `refine` requests. Keep `SearchParamsProbe` on the default page, or the router reuses it for every search string and the rewrite never runs; keep the browse store, toolbar, and filter sheet in `CollectionLayout`, which both routes share, and each page's results inside `CollectionBrowseBoundary`, so a filter keeps the toolbar and open sheet and only the grid can fall back. Build browse URLs from the public path, never `usePathname()`.
- The root layout's `ensureStatic = "prefetch"` keeps the App Shell and per-link prefetches static. Keep it at the root; do not add `navigation()` or `prefetch()` per subtree.
- Server Components are the default; isolate state, effects, browser APIs, and handlers in leaf client components.
- Every image uses `next/image` with reserved dimensions and `sizes="100vw"`, including thumbnails: `deviceSizes: [1320, 1920]` ships two assets that every surface reuses. Do not tune `sizes` or add widths. Preload only the LCP image; keep product grids lazy.
- Link internally with `Link` from `@/components/ui/link`, never `next/link`. It upgrades to the per-link prefetch only on intent, so grids never prefetch every card. Any other prefetch change is a production-measured traffic-versus-latency choice.
- The default is one deployment with clean unprefixed URLs, inline copy, and `shopConfig.localization` `{ country: "US", language: "EN", locale: "en-US" }`: country and language set the Shopify context, locale sets formatting. It has no next-intl, `lib/i18n/`, or `getLocale()`; keep operation locale arguments and cache inputs anyway. The i18n and Markets skills start from this baseline and preserve localized installations.
- Read `shopConfig` from `lib/config/index.ts` directly in server and client code.
- Keep Portless out of `package.json`; `pnpm dev:portless` uses a global install.

Use the `build-shop` skill for route-specific workflow and audits.

## Eve layer

- **Public traffic.** Every message can incur model charges. Mitigate at the edge: BotID through `shopConfig.botid`, plus deployment rate limits and AI Gateway spending controls. Do not add per-session token caps or shrink `modelContextWindowTokens`; they cut conversations short, and compaction already bounds context. Eve's default session budget and the panel's `session-limit` handling are the last resort.
- **One search path.** Product discovery is Shopify's catalog MCP (`agent/connections/shopify.ts`, `search_catalog`), rendered through `present-products`; do not add a Storefront API search tool. The connection needs the UCP agent profile at `/agent/ucp-profile.json`; local and preview environments send Shopify's example profile.
- **Cart ownership.** Cart tools bind the cart from the browser cookie through channel auth context, and the browser refreshes Hydrogen only after turns settle. The channel has no per-user authorization. Never write cart IDs or replay mutations from restored messages. Interrupted writes have no deduplication; never claim exactly-once behavior or retry an uncertain mutation.
- **Bounded work.** Before changing framework behavior, read `node_modules/eve/docs/README.md` and the page it routes to; package-manager links can hide files from recursive searches. Stop discovery once the location, imports, and API shape are clear. Edit authored instructions for copy changes and keep the selected model unless asked. Check `pnpm exec eve registry search <query> --json` before adding an integration, prefer a native integration to a custom transport, and keep the Next.js deployment through `withEve`.
- **Verify what the shopper sees.** For conversation or catalog changes, run several product-search turns in one browser session against real Shopify data and confirm the cards, follow-ups, and token usage; a build or tool result is not proof. For session controls, check restoration, Stop and Clear, and failures; pending input must not look like an empty success. Debug empty responses from the full event stream, pending input, tool outputs, and usage before changing rendering, and keep model-facing catalog data compact without dropping constraints, pagination, or errors. Say which checks were mocked, local, or against a preview; keep diagnostic credentials out of source and output, and default to read-only probes.

## Testing (temporary policy)

Do not add tests, test files, runners, dependencies, or scripts unless the user explicitly asks; missing coverage is not permission. Verify with existing checks such as lint, typecheck, schema validation, builds, and runtime or browser checks, run existing tests when relevant, and report what stayed unverified. A coordinated testing effort comes later.

## Environment files

`.env.example` files hold realistic placeholders, never redaction language like `[redacted]`. Shopify values use their real format (`your-store.myshopify.com`, `shp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`); everything else uses a `your-…-here` string.

<!-- BEGIN:vercel-shop-style -->

## Code Style

### Ordering and exports

- Alphabetize export specifiers, destructuring patterns, interface and type properties, config object keys, i18n JSON keys, and string union members. `pnpm format` sorts imports.
- No barrel files: never an `index.ts` that only re-exports.
- Named exports only in component files; pages use default exports.

### Files

- Keep sub-components in their consumer's file when they share a directive, unless the file gets unwieldy. Split a different directive into `foo-client.tsx` or `foo-server.tsx` beside `foo.tsx`.
- Push `"use client"` as far down as possible; pages, layouts, and data-fetching wrappers stay server components and pass promises or data to client children.
- `lib/` is organized by domain, then execution context, using only the files a domain needs: `index.ts` (universal, never a barrel), `server.ts` (kept out of client graphs), `client.ts` (a React client boundary, not an HTTP client), `action.ts` (`"use server"`, verb + `Action` exports), and `types.ts` (imported with `import type`). Subdivide with the same filenames, such as `lib/cart/gift-card/client.ts`; no descriptive siblings like `cart-client.ts`, flat root modules, or forwarding exports.
- Shopify transports live in their API domain's `server.ts`; pure transforms and formatting helpers live in `index.ts`.
- Storefront models live in their owning domain's `types.ts`; cross-domain primitives in `lib/money/types.ts`, `lib/media/types.ts`, and `lib/pagination/types.ts`; SDK contracts and inferred response types under `lib/shopify/`. Props stay beside their components, and small private types may stay local. Never import shared types from `server.ts` or `action.ts`. Generated artifacts keep their generator's paths.

### Naming

- Files `kebab-case.tsx`, components `PascalCase`, constants `SCREAMING_SNAKE_CASE`, server actions verb + `Action`.
- Props are `interface {ComponentName}Props`. Native-element pass-through uses `ComponentProps<"div">`.
- One React import per file with named imports and inline `type` modifiers (`import { type ReactNode, Suspense } from "react"`), or `import type` when all are types; never `React.*`.

### Spacing

- `Container` sets horizontal padding and max width only; never put `py-*` on it.
- `Page` owns top padding (`pt-10` by default, overridden through `className`) and has no bottom padding; the footer's `pt-20` provides that gap. Full-height layouts add `flex flex-1 flex-col`.
- Wrap sibling sections in `Sections` (`gap-10` by default). Inside a section, use `grid gap-*` on the parent, never margins or `space-y-*` on children.
- Use the gap scale `gap-2.5`, `gap-4`, `gap-5`, `gap-10`. Padding inside components and negative-margin breakouts are fine.

### Tailwind

- Style with utilities, not `app/globals.css`. Register new values in `@theme`; keep `globals.css` to tokens, resets, keyframes, and shared utilities, with no global element rules.
- `@theme inline` does not emit `:root` variables; outside utilities, reference the underlying variable.
- Prefer scale utilities (`h-18`, `top-1/2`) to arbitrary values, which are for off-scale values such as `calc()` or grid templates.
- Prefer `data-[attr=value]` selectors to conditional classes; use `cn()` when classes must be conditional, `data-slot` as styling hooks, and `cva` for variants.
- Interactive elements use `cursor-pointer`; disabled ones use `cursor-not-allowed`.

### Comments

Default to none. A comment is one line stating a hidden constraint, an upstream workaround, a non-obvious invariant, or a cross-system quirk, and survives only if an agent would otherwise break behavior. Never restate names, narrate code, reference current work or PRs, add banners, leave a `TODO` without `TODO(handle): reason`, or write multi-line prose. Keep tooling directives and generated or license headers.

<!-- END:vercel-shop-style -->
