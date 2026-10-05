# Vercel Shop

Vercel Shop is a Next.js storefront for Shopify, deployed to Vercel, with agent skills in `.agents/skills/`. This guide names the three owners and states the boundaries between them inside the storefront.

## Three owners

Every feature in this repo belongs to exactly one owner. Use this as the acceptance test for new work: if a change cannot name its owner, or needs to reach into another owner's territory, redesign it before shipping it.

- **Shopify owns commerce.** Catalog, cart state and mutations, checkout, customer accounts, predictive search, policies, and analytics come from Shopify through the Hydrogen SDK. We do not reimplement commerce logic.
- **Next.js owns the app.** Routing, Server Components, caching and invalidation, metadata, the request boundary (`proxy.ts`) that adapts Hydrogen's handlers, and the storefront's machine-readable surface for answer engines: Markdown representations, `/llms.txt`, structured data, sitemap, and crawl guidance.
- **Eve owns the agent.** Sessions, channels, tools, connections, and `/eve/v1/*`. Eve tools call Shopify directly; Next.js only prepares the browser for them.

Docs and skills describe the product in the same three-owner terms.

## Describe the product, not the change

Code, comments, docs, skills, commit messages, and pull requests describe current behavior in terms of the three owners. They do not narrate the work that produced it.

- Pull requests are terse: what the shopper, merchant, or agent can now do, which owner it belongs to, and how it was verified. No rollout narrative or review history.
- Docs add a detail only when a reader needs it to act or decide. A change touching a feature is not a reason to add implementation specifics about that change; add them only when asked.
- Comments state a hidden constraint on one line or do not exist. Never reference the PR, issue, refactor, or "new" state.
- Names and file placement carry the architecture. If a reader needs prose to find the owner of a module, fix the name or location instead.

## Ownership map

Every module, route, and feature belongs to one owner. Place new work by owner first, then by domain.

**Shopify owns commerce** through the framework-agnostic Hydrogen preview SDK (not the Hydrogen React Router framework).

- Owns: Storefront and Customer Account API clients, catalog data, cart state and mutations, checkout, predictive search, Customer Account OAuth and sessions, policies, Shopify analytics.
- Lives in: `lib/shopify/**` (operations, fragments, transforms, generated types), `lib/cart/**`, `lib/auth/server.ts`, the handlers registered in `proxy.ts`, `lib/<domain>/types.ts` for the domain models transforms produce.
- Must not: be reimplemented in application code. Prices, availability, currency, cart totals, and customer identity always come from Shopify responses.

**Next.js owns the app.**

- Owns: routing and clean URLs, Server Component composition, caching and tag invalidation, metadata and SEO, Suspense and loading geometry, the request boundary that adapts Hydrogen's handlers, and the answer-engine surface: `text/markdown` content negotiation, Markdown representations of home, product, collection, and search, `/llms.txt`, Schema.org data, sitemap, and robots.
- Lives in: `app/`, `components/`, `lib/<domain>/{index,server,client,action}.ts`, `lib/config/`, `next.config.ts`, `proxy.ts`; the answer-engine surface in `lib/markdown/**`, `lib/seo/**`, `app/md/**`, `app/llms.txt/`, `app/sitemap*`, `app/robots.ts`, `components/schema/`.
- Must not: mutate the cart through Server Actions, refresh tokens in Server Components, invalidate public caches for cart changes, or reach into `agent/`.

**Eve owns the agent.**

- Owns: sessions, channels, tools, connections, instructions, model selection, `/eve/v1/*`.
- Lives in: `agent/` (tool definitions and execution in `agent/tools/`, shared execution helpers in `agent/lib/`), `lib/agent/` (browser state, presentation helpers, shared result types), `components/agent/`, `app/api/agent/session` (the only Next.js route Eve needs; it prepares the browser cart).
- Must not: import Next.js request or cache APIs, add a second tool-name dispatcher, recreate a chat API route, or let model arguments select the cart.

## Boundary rules (always apply)

1. **Commerce facts come from Shopify.** Never map locale to currency, hand-write Shopify response types, or guess schema fields. Use `shopify-ai-toolkit` for API facts and validation before adding or changing GraphQL, then `shopify-graphql-reference` for template placement.
2. **Cart writes go through Hydrogen handlers.** `proxy.ts` serves `/api/cart`; components use `useProductForm` and `useCartForm`; Eve cart tools call the handlers directly with the cart bound from the browser cookie. No Server Actions, no cache-tag invalidation for carts.
3. **Shopify fetches, Next.js caches.** `lib/shopify/operations/**/server.ts` exports uncached `fetch*` operations and never imports `next/cache`. `lib/<domain>/server.ts` exports `get*` wrappers that own `"use cache"`, `cacheLife`, and `cacheTag`. Rendered pages call `get*`; Eve tools call `fetch*`. Cursor-paginated browse, search results, and facets also call `fetch*` from `lib/collections/server.ts` and `lib/search/server.ts`: cached cursor pages drift apart and duplicate boundary products, and Search & Discovery changes must appear immediately.
4. **Server Components read auth; they never refresh it.** Use `isCustomerLoggedIn()` for UI state, `requireCustomerSession()` for route gates, and `requireCustomerAccessToken()` immediately before Customer Account API calls. Refresh happens only where Hydrogen can commit cookies.
5. **`components/ui/` takes primitive props only.** No domain types, SDK types, or content helpers. Domain wrappers in `components/<domain>/` supply labels and data.
6. **Copy is inline and server-first.** Keep labels beside their consuming component; reusable content functionality goes in `lib/content/index.ts`, not a string catalog. Server Components pass primitive labels to client leaves; never pass content functions across the Server/Client boundary. Do not add a `t()` runtime or next-intl to the default storefront; in an already localized installation, preserve next-intl, aligned catalogs, and narrowly scoped `NextIntlClientProvider` boundaries.
7. **Two outward-facing agent surfaces, two owners.** Next.js describes the storefront to outside agents through Markdown representations, `/llms.txt`, structured data, and the sitemap, built from the same domain types as the HTML pages. Shopify's own agent endpoints (`/api/mcp`, `/api/ucp/mcp`, `/.well-known/ucp`) are Shopify's; `proxy.ts` only forwards them. Do not reimplement either side in the other, and do not route Eve through the Markdown surface.
8. **Every user-configurable `process.env.X` read has a row in `.env.example`** with a short comment on when to set it, and every `process.env.X` read is listed in `turbo.json` `globalEnv`: Turborepo's strict mode hides undeclared variables from tasks and leaves them out of cache keys.

## Agent skills and Shopify tooling

Shop skills are optional agent guidance for setting up and extending the storefront. They live in `.agents/skills/`; `.claude/skills` is a symlink to the same directory, so edit skills only in `.agents/skills/`. Use plain skill names such as `enable-shopify-markets`.

`shopify-ai-toolkit` is separate external tooling, authoritative for current Shopify documentation, API schemas, operation validation, and store execution. Installing Shop skills does not install it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Shopify layer

Read the installed Hydrogen README and relevant bundled skills before changing an SDK integration. Do not apply React Router loaders, actions, or Oxygen setup to this app.

### Catalog reads

```text
Request → Page → Operation → storefront.request(gql doc) → Shopify API → Transform → Domain type → Component
```

- Presentation uses domain models from `lib/product/types`, `lib/collections/types`, and `lib/customer/types`, never raw Shopify responses. Cross-domain primitives live in `lib/money/types.ts`, `lib/media/types.ts`, and `lib/pagination/types.ts`. SDK-specific contracts and inferred response types stay under `lib/shopify/`.
- "Operation" in the flow above is the `get*` cached read in `lib/<domain>/server.ts` for pages, or the `fetch*` operation in `lib/shopify/operations/**` for uncached reads and Eve tools.
- `storefront.request` injects `$country`/`$language` from its optional `locale: { country, language }` commerce context, defaulting to `shopConfig.localization`. This is the commerce context, not the formatting locale string.

### GraphQL workflow

- Use the API-specific Shopify AI Toolkit skill first: Storefront GraphQL for catalog, cart, and public storefront operations; Customer for authenticated customer data; custom-data first for metafields or metaobjects. If it is unavailable, use official Shopify documentation and validation tooling; never guess.
- Write documents with `gql()` from `@shopify/hydrogen` (Storefront) or `@shopify/hydrogen/customer-account` (Customer Account), compose fragments through the second `gql()` argument, and derive raw response types with `ResultOf<typeof DOC>`.
- Keep the `#graphql` marker or `/* GraphQL */` annotation on static documents.
- Type inference is not schema validation; validate new or changed documents with the Shopify AI Toolkit. Do not run `hydrogen gql check`: it needs the TypeScript JavaScript compiler API, which TypeScript 7 does not ship.
- Do not add repo-local schema snapshots. Agent folders hold only `.agents/skills/` and its `.claude/skills` symlink.

### Cart

- `seedCartData` shares a per-request promise, not a Next.js data-cache entry. Keep carts out of public caches; updates reconcile through Hydrogen's store.
- `prepareCheckoutAction` reads the confirmed checkout URL; it does not mutate the cart.
- Cart types are the deliberate domain-type exception: `lib/cart/types.ts` derives `Cart`, `CartLine`, and seed data from Hydrogen's handlers. Cart integration components may use Hydrogen store/form types; `components/ui/` still may not.

### Customer accounts

Opt-in via `auth.isEnabled` in `lib/config/index.ts`. When enabled, `next.config.ts` requires the app-generated `CUSTOMER_ACCOUNT_SESSION_SECRET` for encrypted cookie storage plus `SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID` and `SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET`. All three are server-only; the session secret is not the Shopify client secret. Read `shopConfig.auth.isEnabled` directly to gate auth surfaces in server and client code alike.

- `lib/auth/server.ts`: encrypted HttpOnly cookie adapter plus read-only login and token helpers.
- `proxy.ts`: Hydrogen login, authorize, refresh, and logout handlers on the customer-account OAuth paths.
- `app/account/(authenticated)/`: auth-gated pages. `components/nav/account.tsx`: read-only session state inside Suspense with a fixed `size-5` icon container. `components/account/sign-out-button.tsx`: same-origin POST so Hydrogen can clear the local session and perform Shopify RP-initiated logout.
- `requireCustomerAccessToken()` redirects refreshable sessions through `/account/refresh`, where Hydrogen rotates tokens and commits the cookie.

## Next.js layer

### Storefront architecture contract

- Preserve route-level data loading, promise boundaries, cache directives, invalidation tags, metadata, redirects, and auth gates while rebuilding presentation. Change them only when the task explicitly changes behavior.
- Routes orchestrate URL and correctness, Shopify operations own fetching and transforms, Server Components compose the shell, client leaves own interaction.
- Model data dependencies before composing the page. Start independent work together and block rendering only where one result is genuinely required by another.
- Keep stable headings, primary media, and likely LCP content in the static shell when the data contract permits. Push request-time inputs to the smallest Suspense boundary that needs them.
- Visible fallbacks match the resolved section's geometry; loading states must not introduce avoidable layout shift.
- Server Components are the default. Isolate state, effects, browser APIs, and event handlers in leaf client components.
- Use `next/image` with reserved dimensions and the shared `sizes="100vw"` on every image, including fixed-size thumbnails. `next.config.ts` ships two assets, `deviceSizes: [1320, 1920]`: the screen picks the small or large one, and grids, product pages, cart, search, and the agent reuse it. Do not tune `sizes` per breakpoint or surface or add widths; layout-specific variants cost more image optimizations and cache misses. Preload only the actual LCP image; keep product grids lazy by default.
- Treat prefetching as a production-measured traffic-versus-latency choice, especially for high-fanout product grids.

Use the `build-shop` skill for the full route-specific workflow and audit guidance.

### Localization default

One deployment, clean unprefixed URLs (`/products/...`), inline component copy, and explicit `shopConfig.localization`: `{ country: "US", language: "EN", locale: "en-US" }`. Country and language configure Shopify context; locale controls display formatting. Changing commerce context does not translate storefront copy.

The default has no next-intl dependency, `lib/i18n/` machinery, or `getLocale()` in `lib/params.ts`. Operation locale arguments and cache inputs may remain intentionally; do not remove them because presentation no longer needs them. The i18n and Markets skills introduce localization from this baseline and must preserve already localized installations.

### Configuration

- `lib/config/index.ts`: `shopConfig` feature toggles and site settings, read directly in server and client code.
- `next.config.ts`: `cacheComponents: true`, `reactCompiler: true`; composes `withBotId` and `withEve` through `withShopConfig` when their toggles are enabled.
- `.oxlintrc.json`, `.oxfmtrc.json`, `components.json`: lint, format, and shadcn/ui configuration.
- `turbo.json`: Turborepo tasks for local and Vercel Remote Caching of `package.json` scripts.
- Environment variables are documented in `.env.example`.
- `pnpm dev:portless` serves local HTTPS through a global [Portless](https://portless.sh) install; keep Portless out of `package.json` dependencies.

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
```

## Eve layer

The assistant uses `agent/`, `withEve`, and `useEveAgent`. Eve tools call Shopify directly through the uncached `fetch*` operations in `lib/shopify/operations/**` and Hydrogen cart handlers.

### Public traffic

The Eve channel is public and every message can incur model charges. Mitigate abuse and cost at the edge: `shopConfig.botid` runs BotID on the channel, and deployments add rate limits and AI Gateway spending controls. Do not add per-session token caps or shrink `modelContextWindowTokens` in `agent/agent.ts`: those cut shopping conversations short mid-task, and Eve's compaction already keeps long sessions inside the model's context window. Eve's framework-default session budget and the panel's `session-limit` handling remain as the last-resort safety net.

### Catalog search

Product discovery is Shopify's catalog MCP (`agent/connections/shopify.ts`, `search_catalog`), rendered through `present-products`. There is one search path; do not add a Storefront API search tool beside it. `browse-collection`, `list-collections`, `get-recommendations`, and `get-product-details` are navigation and detail reads, not search. The connection requires the public UCP agent profile served at `/agent/ucp-profile.json`; local and preview environments send Shopify's example profile because their URLs are unreachable.

### Cart ownership

Eve cart tools bind the cart from the incoming browser cookie through channel auth context. The browser refreshes Hydrogen only after turns settle; never write cart IDs or replay mutations from restored messages. The default channel is public with optional BotID, not per-user session authorization. Completed Eve steps are durable, but interrupted writes have no application-owned deduplication; do not claim exactly-once behavior or automatically retry an uncertain mutation.

### Keep Eve work bounded

- Before changing framework behavior, start with `node_modules/eve/docs/README.md` and read the page it routes the task to. Resolve the installed package from this app; package-manager links can hide files from recursive searches even when direct reads work.
- Inspect public types or follow additional references only when that guide leaves a concrete question unanswered. Stop discovery once the file location, imports, and API shape are clear; implement the smallest complete change, then expand investigation only when a focused check fails.
- For copy-only changes, edit the existing authored instructions. Preserve the selected model unless the user requests a model change.
- Before adding an external integration, use `pnpm exec eve registry search <query> --json` and `pnpm exec eve registry view <item>`. Prefer a suitable native integration over a custom transport. Preserve this app's Next.js deployment through `withEve`; standalone Eve deployment instructions are not a replacement for it.

### Verify shopper-visible behavior

- For conversation or catalog changes, check multiple product-search turns in one browser session with real Shopify responses. Confirm visible cards, follow-up responses, and token usage; a successful build, HTTP status, or tool result does not establish that the shopper saw a result.
- For session-control changes, check restoration, Stop/Clear recovery, and failures. Pending input requests must not appear as successful empty responses or allow messages to disappear into a paused session.
- When responses are empty, inspect the complete event stream, pending input requests, tool outputs, and cumulative usage before changing rendering. Keep model-facing catalog data compact without dropping requested constraints, pagination, or error information.
- Use the narrowest checks that establish the changed behavior. Distinguish mocked or replayed checks, local production-browser checks, and checks against the deployed preview; do not present one as proof of another. Keep diagnostic credentials out of source and output, and default to read-only probes.

## Storefront skills (optional)

These skills walk through setup and common extensions:

- `init-vercel-shop`: scaffolding and Shopify credentials
- `shopify-graphql-reference`: integrating Shopify-validated GraphQL into the template
- `enable-shopify-markets`: Shopify Markets and multi-locale support
- `enable-i18n`: locale-prefixed routing and i18n without Markets
- `enable-shopify-menus`: navigation menus
- `enable-analytics`: analytics
- `build-shop`: storefront architecture, commerce behavior, and rendering performance
- `update-shop`: keeping the storefront current with template changes

These are agent-side conveniences. The template runs and deploys without them.

## Testing (temporary policy)

We plan to write tests in a future, coordinated testing effort. For now, do not add tests à la carte while fixing bugs, adding features, refactoring, or updating docs. Do not introduce test files, suites, runners, dependencies, or package scripts unless the user explicitly requests that testing work. Missing test coverage alone is not permission to expand the task.

Continue to verify changes with existing relevant checks, such as lint, formatting, typechecking, schema validation, builds, and direct runtime or browser checks. Run existing tests when relevant, and report unverified behavior clearly. This is a temporary pause on unsolicited test additions, not a decision against testing.

## Environment files

`.env.example` files are examples, not secret manifests — never use redaction language like `[redacted]` or `<secret>` in them. Use realistic placeholders: Shopify values get their real format or prefix (`your-store.myshopify.com`, `shp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`, a sample Storefront token), and everything else gets a `your-…-here`-style string (`your-session-secret-here`).

<!-- BEGIN:vercel-shop-style -->

## Code Style

### Ordering & Organization

- Alphabetize named export specifiers, object destructuring patterns, interface and type properties, config object keys, i18n JSON keys (within each section and at the top level), and string union type members.
- No barrel files — never create an `index.ts` that only re-exports. Import from the source file directly.
- oxfmt handles import sorting automatically via `pnpm format`.

### Component Boundaries

- Push `"use client"` as far down the tree as possible. Pages, layouts, and data-fetching wrappers stay as server components.
- Fetch data in server components or server actions; pass promises or resolved data down to client children.

### File Organization

- Keep sub-components in the same file as their consumer when they share the same directive (or lack one). Only split into a separate file when the components need different directives (e.g., one is `"use client"` and the other is a server component) or when the file becomes unwieldy.
- A single file per logical component is preferred.
- When a directive split is necessary, suffix the carved-out file with the directive: `foo.tsx` (the entry, typically a server component) is paired with `foo-client.tsx` for `"use client"` sub-components — e.g. `sidebar.tsx` + `sidebar-client.tsx`, `mobile-tabs.tsx` + `mobile-tabs-client.tsx`. Use `foo-server.tsx` symmetrically if a server-only piece needs to be carved out of an otherwise-client file. The suffix keeps the pair adjacent in the directory listing.

#### `lib/<domain>/` files

Organize `lib/` by domain first, then execution context. Use only the files each domain needs:

- `index.ts` — universal implementation safe for server and client imports; never a re-export barrel.
- `server.ts` — server-side implementation; keep it out of client import graphs.
- `client.ts` — `"use client"` implementation.
- `action.ts` — `"use server"` entry points, with verb + `Action` suffix on each export.
- `types.ts` — named contracts owned by the domain, imported with `import type` directly from this file.

Subdivide large domains into meaningful subdirectories using the same filenames: `lib/cart/gift-card/client.ts`, `lib/shopify/operations/products/server.ts`, and `lib/markdown/product/index.ts`. Do not add descriptive sibling files such as `cart-client.ts`, flat root implementation modules, empty entry points, or forwarding exports.

Keep storefront models in their owning domain's `types.ts`, such as `lib/product/types.ts` and `lib/customer/types.ts`; shared use does not change domain ownership. Cross-domain primitives live in `lib/money/types.ts`, `lib/media/types.ts`, and `lib/pagination/types.ts`. Types-only domains do not need an `index.ts` or re-export barrel. Keep SDK-specific contracts and inferred response types under `lib/shopify/`. Preserve SDK-derived cart types in `lib/cart/types.ts`. Component props stay beside their components, and small private implementation types may remain local. Consumers must not import shared types from `server.ts` or `action.ts`. Generated artifacts retain their generator-owned paths and naming.

`client.ts` means a React client boundary, not an HTTP client wrapper. Shopify transports belong in their API domain's `server.ts`. Pure transforms and formatting helpers belong in `index.ts`, even when their current callers are all server-side.

### Naming

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Server actions: verb + `Action` suffix (`prepareCheckoutAction`)
- Props interfaces: `{ComponentName}Props`. Use `interface` (not `type`) so consumers can extend or augment.
- Keep React imports in one declaration per file, using explicit named imports rather than namespace imports or ambient `React.*` references. When importing both types and runtime values, use inline type modifiers: `import { type ReactNode, Suspense } from "react"`. Use `import type { ComponentProps, ReactNode } from "react"` when all imports are types.
- Native-element prop pass-through: use `ComponentProps<"div">`, not `ComponentPropsWithoutRef`. Refs are regular props in React 19, so the extra type is unnecessary noise.
- Constants: `SCREAMING_SNAKE_CASE`

### Spacing

- `Container` provides horizontal padding and max-width only. It does **not** manage vertical spacing.
- `Page` (`components/ui/page.tsx`) owns page-level top padding. It defaults to `pt-10` and accepts `className` for overrides — `<Page className="pt-0">` for pages whose first child is flush to the nav (home, PDP), or `<Page className="pt-2.5 md:pt-10">` for search and collection where the title sits tighter to the nav on mobile. `Page` deliberately has no bottom padding; the gap above the footer comes from the footer's own `pt-20`. `Page` doesn't set `flex` by default; layouts that need to fill viewport height (account layout, `not-found`) add `flex flex-1 flex-col` via `className`.
- For vertical rhythm between sibling sections, wrap them in `<Sections>` (`components/ui/sections.tsx`). Default `gap-10`; override per page via `className` (e.g. `<Sections className="gap-5">`). `<Sections>` happily mixes full-bleed and contained children since each child can be a `<Container>`, a banner, or anything else.
- Inside a single section, prefer `grid gap-*` on the immediate parent. Don't add `mb-*` / `mt-*` / `my-*` / `space-y-*` to children for inter-sibling spacing.
- Canonical gap scale: `gap-2.5`, `gap-4`, `gap-5`, `gap-10`. Don't invent new values for the same job.
- Padding _inside_ a component (button, card, carousel breathing room via `py-*`) is fine. Negative-margin breakouts (`-mx-5`) are fine.
- This convention is rolled out across the template. New pages should use `<Page>` + `<Sections>` from day one — never put `py-*` on `<Container>`.

### Tailwind & Styling

- **Solve it the Tailwind way, not in `globals.css`.** When you reach for new styling, the first move is a Tailwind utility on the element — not a rule in `app/globals.css`. If the value isn't already a token, register it in `@theme` (e.g. `--font-display: var(--font-bricolage)`) so it becomes a real utility (`font-display`) you can apply per element. Reserve `globals.css` for things that genuinely can't be expressed as a per-element class: theme tokens (`@theme`), CSS resets in `@layer base`, `@keyframes`, and one-off utilities under `@layer utilities` that compose into many components. Adding global element rules (`h1, h2, h3 { ... }`, `a { ... }`) couples styling to markup invisibly and is almost always avoidable.
- **Watch out for `@theme inline`**: with the `inline` keyword Tailwind inlines the value into utility-class declarations rather than emitting a `:root` CSS variable. So `@theme inline { --font-display: var(--font-bricolage) }` produces a working `font-display` utility but does **not** make `var(--font-display)` resolvable from arbitrary CSS. Reference the underlying variable (`var(--font-bricolage)`) directly if you need it outside a utility.
- **Prefer scale utilities to arbitrary values.** Tailwind v4's spacing scale is dynamic (`n` = `n × 0.25rem`), so most literal lengths have an exact equivalent: `h-[4.5rem]` → `h-18`, `min-w-[8rem]` → `min-w-32`, `top-[50%]` → `top-1/2`, `rounded-[2px]` → `rounded-xs`. Reserve `[…]` for genuinely off-scale values — `calc()`, `oklch()`, `vw`/`vh`, grid templates, transition lists.
- Prefer `data-[attr=value]` selectors over conditional class assembly.
- Use `cn()` from `cn` when classes must be conditional.
- Use `data-slot` attributes as stable styling hooks on compound components.
- Use CVA (`cva`) for multi-variant component APIs.
- Interactive elements (buttons, clickable links, CTAs) must use `cursor-pointer`. Disabled interactive elements must use `cursor-not-allowed`.

### Exports

- Named exports only in component files. Pages use default exports per Next.js convention.
- Alphabetize specifiers in export statements.

### Comments

Default to writing none. Well-named identifiers, types, and tests already document WHAT the code does. Add a comment only when removing it would leave a future reader genuinely confused — and the reason is something they couldn't recover by reading the surrounding code.

**Comments are terse guardrails for agents, not documentation.** Use one sentence on one physical line and state only the irreducible hidden WHY. Omit background, examples, history, setup, and consequences that are recoverable from the code. If the comment needs more than one line, improve the names or move the explanation to docs or the PR.

A comment earns its place when it captures one of:

- A hidden constraint (e.g. "cookies can't be set during stream").
- A workaround for a specific upstream/library bug.
- A non-obvious algorithmic choice or invariant.
- A cross-system quirk (e.g. "Shopify's `productFilters` only affects facet counts, not results").

Before keeping a comment, ask: would an agent reasonably break behavior without this warning? If not, delete it.

Don't write:

- JSDoc that restates the function name (`/** Verify webhook signature */` over `verifyWebhook()`). Either drop it or replace it with the WHY.
- Inline comments that narrate the next line (`// fetch products` above `fetchProducts()`).
- References to current work (`// added for cart refactor`, `// part of issue #123`, `// new`). That belongs in the PR description.
- File-top banner comments and `// ── Section ──`-style dividers. If a file is large enough that you reach for one, split the file instead.
- Bare `// TODO` without an owner or actionable reason. Either write `// TODO(handle): explain blocker` or fix the thing now.
- Multi-line prose comments or docstrings. Preserve generated headers, licenses, and tooling-required blocks only.

Keep `// eslint-disable-*`, `// @ts-expect-error`, `// biome-ignore`, and other tooling directives — those are not prose comments.

<!-- END:vercel-shop-style -->
