# Vercel Shop

Vercel Shop is a Next.js storefront for Shopify, deployed to Vercel, with agent skills in `.agents/skills/`.

## Three owners

Every feature belongs to exactly one owner; place new work by owner, then by domain. If a change cannot name its owner, or reaches into another owner's territory, redesign it.

- **Shopify owns commerce** through the framework-agnostic Hydrogen preview SDK, not the Hydrogen React Router framework: API clients, catalog, cart, checkout, search, customer accounts, policies, and Shopify analytics, in `lib/shopify/`, `lib/cart/`, `lib/auth/`, and the handlers `proxy.ts` registers. Prices, availability, currency, cart totals, and customer identity always come from Shopify responses.
- **Next.js owns the app**: routing, Server Components, caching, metadata and SEO, Suspense, the request boundary around Hydrogen's handlers, and the answer-engine surface (Markdown representations, `/llms.txt`, structured data, sitemap, robots), in `app/`, `components/`, and `lib/<domain>/`.
- **Eve owns the agent**: sessions, channels, tools, instructions, model selection, and `/eve/v1/*`, in `agent/`, `lib/agent/`, and `components/agent/`. It extends Eve's channels and tool registry instead of adding chat routes or dispatchers.

## Invariants

1. **Commerce facts come from Shopify.** Never map locale to currency, hand-write Shopify response types, or guess schema fields. Presentation uses domain models, never raw responses.
2. **Cart writes go through Hydrogen's handlers.** `proxy.ts` serves `/api/cart`, components use `useProductForm` and `useCartForm`, and Eve cart tools call the handlers. Carts never use Server Actions, public caches, or cache-tag invalidation. The one direct write, `createEmptyCart`, gives a new agent session a cart cookie before its first line.
3. **Shopify fetches, Next.js caches.** `lib/shopify/operations/**/server.ts` exports uncached `fetch*` operations; `lib/<domain>/server.ts` wraps them in cached `get*` functions. Pages call `get*`; Eve tools, Load more pages, filtered or sorted views, and search call `fetch*`. Account pages call the per-customer reads in `lib/shopify/operations/customer/server.ts` directly.
4. **Server Components read auth; they never refresh it.** Use `isCustomerLoggedIn()` for UI state, `requireCustomerSession()` for route gates, and `requireCustomerAccessToken()` right before Customer Account API calls.
5. **Server Actions are public endpoints.** Each `action.ts` export parses every argument with a module-private `zod` schema, `z.strictObject` for objects, before any other work.
6. **Shopify HTML is sanitized when fetched.** Render `body`, `contentHtml`, or `descriptionHtml` only after its `fetch*` operation passes it through `sanitizeShopifyHtml` from `lib/shopify/html/server.ts`.
7. **`components/ui/` takes primitive props only.** Wrappers in `components/<domain>/` supply labels and data.
8. **Copy is inline and server-first.** Labels live beside their component, shared content helpers in `lib/content/index.ts`, and client leaves receive primitive labels. The default storefront has no `t()` runtime or next-intl; a localized installation keeps its aligned catalogs and narrowly scoped `NextIntlClientProvider` boundaries.
9. **Locale stays explicit.** `shopConfig.localization` sets the default Shopify context (`country`, `language`) and formatting (`locale`). Keep locale arguments on operations and in cache inputs even with one locale.
10. **Each side keeps its own agent surface.** Next.js describes the storefront for answer engines from the same domain types as the HTML pages. Shopify's `/api/mcp`, `/api/ucp/mcp`, and `/.well-known/ucp` are Shopify's; `proxy.ts` only forwards them.
11. **Every environment variable is declared.** Each user-configurable `process.env.X` read has a commented row in `.env.example` with a realistic placeholder, and every read is listed in `turbo.json` `globalEnv`; Turborepo's strict mode hides undeclared variables.

## Next.js

- Keep stable headings, primary media, and likely LCP content in the static shell. Push request-time reads into the smallest Suspense boundary, with a fallback that matches the resolved geometry, and do not opt out with `export const instant = false`.
- Routes with runtime params render a synchronous page that wraps their async content in `Suspense` with an `aria-busy="true"` skeleton exported beside the component it mirrors, not `loading.tsx`.
- Link internally with `Link` from `@/components/ui/link`, never `next/link`; it prefetches on intent.
- Images use `next/image` with reserved dimensions and the shared `sizes="100vw"`; do not tune `sizes` or add widths.
- Read `shopConfig` from `lib/config/index.ts` directly in server and client code.

Use the `build-shop` skill for route work and audits; it documents the rendering, caching, and prefetch architecture.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Shopify

- Read the installed Hydrogen README and bundled skills before changing an SDK integration; React Router loaders, actions, and Oxygen setup do not apply.
- Write GraphQL with `gql()` from `@shopify/hydrogen` or `@shopify/hydrogen/customer-account`, and type responses with `ResultOf<typeof DOC>`. Validate documents with the `shopify-ai-toolkit` skill or official Shopify documentation, never by guessing; `shopify-graphql-reference` covers placement.
- `lib/cart/types.ts` derives cart types from Hydrogen's handlers, the one exception to domain types; `components/ui/` still never sees them.
- Customer accounts are opt-in through `shopConfig.auth.isEnabled`. `CUSTOMER_ACCOUNT_SESSION_SECRET` is app-generated, not the Shopify client secret.

## Eve

- Shop Agent serves public traffic, and every message can incur model charges. Control spend at the edge with BotID (`shopConfig.botid`), deployment rate limits, and AI Gateway spending controls, not by cutting conversations short.
- Product search and store questions go through Shopify's `/api/ucp/mcp` with `callShopifyMcpTool`; do not add a parallel search tool or MCP connection.
- Cart tools take the cart from the browser cookie through channel auth, never from model arguments or restored messages. Cart writes are not deduplicated: never retry an uncertain mutation or claim exactly-once behavior.
- Read `node_modules/eve/docs/README.md` before changing framework behavior, and check `pnpm exec eve registry search <query> --json` before adding an integration.
- Verify conversation changes in a browser against real Shopify data; a build or a tool result is not proof.

## Skills and releases

Edit skills only in `.agents/skills/` (`.claude/skills` links to it), and refer to them by plain name, such as `enable-shopify-markets`.

`.vercel-shop/template.json` names the Vercel Shop release this storefront is based on. Once per session, before substantial work, check whether `vercel/shop` on GitHub has a newer `template@*` release. If it does, or `template.json` is missing, tell the user and suggest the `update-shop` skill. Upgrade only when the user asks, and keep template updates out of unrelated changes.

## Testing

Run `pnpm check` after every change; it lints, checks formatting, and typechecks in seconds without Shopify credentials. Lint enforces key order, file names, export style, and the import boundaries between owners. Do not add tests, test runners, or test dependencies unless the user asks. Verify further with builds and runtime or browser checks, and report what stayed unverified.

## Writing

- Code, comments, docs, skills, commits, and pull requests describe current behavior, not the work that produced it.
- Pull requests say what a shopper, merchant, or agent can now do and how it was verified.
- Names and file placement carry the architecture. If a reader needs prose to find a module's owner, fix the name or location.

<!-- BEGIN:vercel-shop-style -->

## Code Style

### Ordering and exports

- Alphabetize export specifiers, destructuring patterns, type properties, JSON keys, and string union members.
- No barrel files: never an `index.ts` that only re-exports.

### Files

- Push `"use client"` to the leaves. Split a different directive into `foo-client.tsx` or `foo-server.tsx` beside `foo.tsx`.
- `lib/` is organized by domain, then execution context, using only the files a domain needs: `index.ts` (universal), `server.ts`, `request.ts` (takes `Request` or `Headers` explicitly for `proxy.ts` and Route Handlers), `client.ts` (a React client boundary), `action.ts` (`"use server"`, verb + `Action` exports), and `types.ts`. Subdivide with the same filenames, such as `lib/agent/cart/client.ts`, never descriptive siblings like `cart-client.ts`.
- Shared models live in their domain's `types.ts`, with cross-domain primitives in `lib/money/`, `lib/media/`, and `lib/pagination/`. Never import shared types from `server.ts` or `action.ts`.

### Naming

- Components `PascalCase`, constants `SCREAMING_SNAKE_CASE`, props `interface {ComponentName}Props`.
- One React import per file with inline `type` modifiers; never `React.*`.

### Spacing

- `Container` sets horizontal padding and max width only, `Page` owns top padding, and `Sections` spaces sibling sections.
- Parents space their children with `grid gap-*`; children carry no outer margins, so a component keeps its layout wherever it is placed. Reuse nearby spacing values and leave spacing outside the task alone.

### Tailwind

- Style with utilities. `app/globals.css` holds only `@theme` tokens, resets, keyframes, and shared utilities; `@theme inline` emits no `:root` variables.
- Prefer scale utilities to arbitrary values, and `data-[attr=value]` selectors to conditional classes; use `cn()`, `data-slot`, and `cva` when needed.
- Interactive elements use `cursor-pointer`; disabled ones use `cursor-not-allowed`.

### Comments

Default to none. A comment is one line stating a hidden constraint, upstream workaround, or non-obvious invariant that an agent would otherwise break. Never narrate code, reference current work, add banners, or leave a `TODO` without `TODO(handle): reason`. Keep tooling directives and generated or license headers.

<!-- END:vercel-shop-style -->
