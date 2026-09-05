# Shop Template Guide

This file provides guidance for agents working in the template.

## Recommended Project Plugins

These project-scoped plugins are not required to run the template, but they make agent work in this codebase substantially better. If you're working with an agent that supports them, install with:

```bash
npx plugins add vercel/shop --scope project --yes
npx plugins add vercel/vercel-plugin --scope project --yes
npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
```

- `vercel-shop` provides storefront-specific skills and commands such as `/vercel-shop:enable-shopify-markets`.
- `vercel-plugin` provides generic Vercel and Next.js skills.
- `shopify-ai-toolkit` is authoritative for current Shopify documentation, API schemas, operation validation, and store execution.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## The AI assistant uses AI SDK — read its bundled docs

The opt-in assistant is served by `app/api/chat/route.ts` and built with AI SDK. Before changing the route, agent, tools, or `useChat` client, read the relevant guide in `node_modules/ai/docs/`.

## Critical Rules (Always Apply)

1. **Inline shopper-facing copy where it is used.** Keep labels and simple interpolation alongside their consuming components. Extract reusable content functionality into `lib/content/index.ts`, not a catalog of strings or one file per namespace. Do not add a custom `t()` parser, message-key runtime, or next-intl to the default storefront.
2. **Keep copy server-first.** Server Components pass primitive labels to client leaves where appropriate; interactive copy can live in the leaf that uses it. Never pass ordinary content functions across the Server/Client Component boundary. In an already localized installation, preserve next-intl, aligned catalogs, and narrowly scoped `NextIntlClientProvider` boundaries.
3. **Components in `ui/` must NOT import domain types or content helpers**. Accept primitive props only; domain wrappers supply labels.
4. **Always use `shopify-ai-toolkit` for Shopify API facts and validation** before adding or changing GraphQL. Use `/vercel-shop:shopify-graphql-reference` afterward for this template's operation placement, transforms, cache role, locale flow, and invalidation. Never treat the Vercel Shop skill as a schema source or guess Shopify fields.
5. **Every user-configurable `process.env.X` read needs a row in `.env.example`** with a short comment explaining when to set it. If you add a new env var that toggles a feature, document it there so a fresh clone has a complete env reference.

## Storefront Architecture Contract

- Preserve route-level data loading, promise boundaries, cache directives, invalidation tags, metadata, redirects, and auth gates while rebuilding presentation. Change them only when the task explicitly changes behavior.
- Keep responsibilities layered: routes orchestrate URL and correctness, Shopify operations own public-data fetching/cache/transforms, Server Components compose the shell, and client leaves own interaction. Cart mutations use Hydrogen's server handlers, not Server Actions or public-cache invalidation.
- Model data dependencies before composing the page. Start independent work together and block rendering only where one result is genuinely required by another.
- Keep stable headings, primary media, and likely LCP content in the static shell when the data contract permits it. Push request-time inputs to the smallest Suspense boundary that needs them.
- Make visible fallbacks match the resolved section's geometry. A loading state must not introduce avoidable layout shift.
- Keep Server Components as the default. Isolate state, effects, browser APIs, and event handlers in leaf client components.
- Use `next/image` with reserved dimensions and truthful `sizes`. Preload only the actual LCP image; keep product grids lazy by default.
- Treat prefetching as a production-measured traffic-versus-latency choice, especially for high-fanout product grids.

Use `/vercel-shop:build-shop` when the project plugin is installed for the full route-specific workflow and audit guidance.

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

Inside a domain folder under `lib/`, name files by execution context — same idea as the directive suffix above, applied to the lib side:

- `index.ts` — universal modules (safe to import from server _and_ client code).
- `server.ts` — server-only modules. Top-of-file `import "server-only"` when the runtime guard helps.
- `client.ts` — `"use client"` modules.
- `action.ts` — `"use server"` server actions (verb + `Action` suffix on each export).

Examples that already follow this: `lib/cart/{index,server,client,action}.ts`, `lib/collections/{action,server}.ts`, `lib/auth/server.ts`.

Two exceptions that don't fit cleanly:

- A folder grouping multiple modules of the _same_ execution context (one module per resource), like `lib/markdown/` (one generator per route), or `lib/agent/tools/` (one tool per file). Keep descriptive filenames per module — the convention's purpose-by-filename collapses when there are several purpose-equal modules in one folder.
- Flat single-file modules at `lib/` root (`lib/types.ts`, `lib/seo.ts`, etc.). They aren't in a domain folder, so the convention doesn't apply.

Avoid the word "client" in a filename to mean an HTTP/SDK client wrapper — that collides with the runtime meaning. Use a verb (`fetch.ts`) or product noun (`shopify.ts`) instead.

### Naming

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Server actions: verb + `Action` suffix (`prepareCheckoutAction`)
- Props interfaces: `{ComponentName}Props`. Use `interface` (not `type`) so consumers can extend or augment.
- Native-element prop pass-through: use `React.ComponentProps<"div">` (with `import type * as React from "react"`), not `ComponentPropsWithoutRef`. Refs are regular props in React 19, so the extra type is unnecessary noise.
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

## Overview

This is a Next.js 16 storefront template integrated with Shopify. It uses the App Router, React 19, Server Components, Tailwind CSS 4, and pnpm. It also ships an opt-in AI shopping assistant built with AI SDK.

The pinned `@shopify/hydrogen` dependency is the framework-agnostic preview SDK, not the Hydrogen React Router framework. Next.js owns routing, Server Component rendering, and public-data caching/invalidation. Hydrogen owns Shopify API clients, cart forms and store, predictive-search handlers, and Customer Account OAuth/session helpers. `proxy.ts` adapts Hydrogen's registered handlers to Next.js; the template supplies encrypted cookie storage and auth gates. Read the installed Hydrogen README and relevant bundled skills before changing an SDK integration; do not apply React Router loaders, actions, or Oxygen setup to this app.

The default is one deployment with clean, unprefixed URLs (`/products/...`), inline component copy, and explicit `shopConfig.localization` settings: `{ country: "US", language: "EN", locale: "en-US" }`. Country and language configure Shopify context; locale controls display formatting. Currency always comes from Shopify responses, never from a locale-to-currency map. Changing commerce context does not translate storefront copy.

The default has no next-intl dependency, `lib/i18n/` machinery, or `getLocale()` in `lib/params.ts`. Operation locale arguments and cache inputs may remain intentionally; do not remove them just because presentation no longer needs locale plumbing. The i18n and Markets skills introduce localization from this baseline and must preserve already localized, customized installations.

## Development Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
```

## Directory Structure

- `app/` for routes, including the guarded AI assistant endpoint at `app/api/chat/route.ts`
- `lib/agent/` for the AI SDK agent, tools, and json-render catalog
- `lib/shopify/` for Shopify operations, fragments, transforms, and types
- `lib/types.ts` for provider-agnostic domain types
- `components/ui/` for presentational primitives
- `components/product/` for domain-aware product wrappers
- `lib/product.ts` for variant URL construction and selected-option parsing

## Data Flow

Catalog reads follow this flow:

```text
Request → Page → Operation → storefront.request(gql doc) → Shopify API → Transform → Domain type → Component
```

Cart interactions use Hydrogen's client store and server handlers:

- Use `useProductForm` for standard product purchases and `useCartForm` for cart forms. `proxy.ts` serves `/api/cart` through Hydrogen's registered handlers.
- Gift-card purchases use `addGiftCardToCart` in `lib/cart/gift-card-client.ts` to preserve recipient and scheduling line attributes. The pinned preview's add-form bindings omit line attributes; preserve this adapter until the SDK forwards them.
- Assistant tools mutate through `runCartMutation` in `lib/cart/server.ts`. The client bridge refreshes Hydrogen's cart store after successful tool results without replaying mutations from restored conversations.
- `seedCartData` shares a per-request promise, not a Next.js data-cache entry. Keep carts out of public caches; cart updates reconcile through Hydrogen's store rather than cache-tag invalidation.
- `prepareCheckoutAction` reads the confirmed checkout URL; it does not mutate the cart.
- Cart types are the deliberate domain-type exception: `lib/cart/index.ts` derives `Cart`, `CartLine`, and seed data from Hydrogen's handlers. Cart integration components may also use Hydrogen store/form types. Keep SDK and domain types out of `components/ui/`; wrappers pass primitive props.

## Storefront Skills (Optional Plugin)

If the `vercel-shop` plugin is installed (see "Recommended Project Plugins" above), agents have access to slash commands that walk through common storefront extensions:

- Integrating Shopify-validated GraphQL into the template: `/vercel-shop:shopify-graphql-reference`
- Shopify Markets and multi-locale support: `/vercel-shop:enable-shopify-markets`
- Locale-prefixed routing + i18n (no Markets): `/vercel-shop:enable-i18n`
- Navigation menus: `/vercel-shop:enable-shopify-menus`
- Analytics: `/vercel-shop:enable-analytics`
- Storefront architecture, commerce behavior, and rendering performance: `/vercel-shop:build-shop`
- Keeping the storefront current with template changes: `/vercel-shop:update-shop`

These are agent-side conveniences. The template runs and deploys without them.

## Authentication

Customer authentication uses Hydrogen's Shopify Customer Account OAuth/session helpers. It is **opt-in**: set `auth.isEnabled` to `true` in `lib/config.ts` to enable it. When enabled, `next.config.ts` requires the app-generated `CUSTOMER_ACCOUNT_SESSION_SECRET` for encrypted cookie storage and both Shopify-issued credentials: `SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID` and `SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET`. Keep both secrets server-only; the session secret is not the Shopify client secret. Read `shopConfig.auth.isEnabled` directly from `lib/config.ts` to gate auth surfaces in server and client code alike.

Key files:

- `lib/auth/server.ts` — encrypted HttpOnly cookie adapter plus read-only login/token helpers
- `proxy.ts` — Hydrogen login, authorize, refresh, and logout handlers on the customer-account OAuth paths
- `app/account/(authenticated)/` — auth-gated account pages
- `components/nav/account.tsx` — read-only nav session state inside Suspense
- `components/account/sign-out-button.tsx` — same-origin POST logout form

Server Components must not refresh tokens because they cannot commit cookies. Use `isCustomerLoggedIn()` for UI state, `requireCustomerSession()` for route gates, and `requireCustomerAccessToken()` immediately before Customer Account API operations. The latter redirects refreshable sessions through `/account/refresh`, where Hydrogen can rotate tokens and commit the encrypted cookie.

The nav reserves a fixed `size-5` icon container to avoid layout shift. The `(authenticated)` route group owns protected account UI, while `proxy.ts` owns the OAuth response boundaries via Hydrogen's registered handlers. Logout must remain a same-origin POST so Hydrogen can clear the local session and perform Shopify RP-initiated logout.

## Shopify GraphQL Workflow

- Use the API-specific Shopify AI Toolkit skill first: Storefront GraphQL for catalog/cart/public storefront operations, Customer for authenticated customer data, and custom-data first for metafields or metaobjects.
- Let Shopify AI Toolkit search current documentation and validate the complete operation. If it is unavailable, use official Shopify documentation and validation tooling; never guess.
- Use `/vercel-shop:shopify-graphql-reference` afterward for template-specific operation placement, fragments, locale flow, cache role, transforms, invalidation, and route composition.
- Write documents with `gql()` from `@shopify/hydrogen` (Storefront) or `@shopify/hydrogen/customer-account` (Customer Account), compose fragments through the second `gql()` argument, and derive raw response types with `ResultOf<typeof DOC>` instead of hand-writing interfaces. `storefront.request` injects `$country`/`$language` from its optional `locale: { country, language }` commerce context, defaulting to `shopConfig.localization`; this is not the formatting locale string.
- Keep the `#graphql` marker or `/* GraphQL */` annotation on static documents. `pnpm codegen` validates Storefront documents across `app/`, `components/`, `hooks/`, and `lib/` against the configured live schema, including cart/search fragments. Customer Account documents in the dedicated `.graphqlrc.ts` paths use Hydrogen's bundled schema; add new Customer Account paths to that project and exclude them from Storefront validation.
- Type inference is not schema validation. The pinned Hydrogen `gql check` CLI requires a JavaScript TypeScript compiler API unavailable in TypeScript 7; use the configured codegen projects instead. Build and typecheck gate on both projects. Live checks remain necessary for store-specific permissions, values, and schema/version drift.
- Do not add repo-local schema snapshots or agent-specific folders to the template.

## Key Patterns

- Routes live under `app/` and use clean URLs like `/products/handle`.
- Read `shopConfig.localization` for the deployment's explicit country, language, and formatting locale; use inline component copy for UI text.
- Multi-locale URL routing is documented in `/vercel-shop:enable-i18n` and is intentionally not enabled by default.
- Catalog and customer presentation uses domain types from `@/lib/types`, not raw Shopify responses. Cart types come from `@/lib/cart` and Hydrogen's store/form APIs as described above; presentational primitives remain independent of both.
- Prefer Tailwind data-attribute selectors over conditional class assembly.
- Follow the `ui/` → `product/` wrapper pattern when adding reusable product UI.

## Configuration

- `next.config.ts`: `cacheComponents: true`, `reactCompiler: true`
- `.oxlintrc.json`: oxlint linting configuration
- `.oxfmtrc.json`: oxfmt formatting configuration
- `components.json`: shadcn/ui configuration

Environment variables are documented in `.env.example`.
