---
name: enable-i18n
description: >
  Enable next-intl-based i18n in the shop template — locale-prefixed URLs,
  per-locale message catalogs, and a locale switcher. Use when the user wants
  "locale URLs", "multi-language", or "i18n" without Shopify Markets
  integration. For full Shopify Markets multi-region commerce (region-aware
  pricing, inventory, payments), use `enable-shopify-markets` instead — this
  skill is the routing/i18n layer only.
---

# Enable i18n (next-intl, no Markets)

Add next-intl so the storefront serves locale-prefixed URLs (`/en-US/products/foo`), loads per-locale message catalogs, and exposes a copy-language switcher. The default is one deployment with clean URLs, inline component copy with reusable functions in `lib/content/index.ts`, and `shopConfig.localization = { country: "US", language: "EN", locale: "en-US" }`. There is no next-intl dependency, message catalog, `lib/i18n/` directory, or `lib/params/server.ts` locale resolver to reuse in a fresh template.

> **Use `enable-shopify-markets` instead** for regional commerce. This skill translates storefront copy and adds routing; it must not infer a commerce country from a copy locale or mutate cart buyer country when language changes. Keep Shopify country/language configuration explicit, preserve intentional operation locale/cache inputs, and always display currency from Shopify responses.

## Inspect and preserve the installation

Read scoped `AGENTS.md`, `package.json`, `next.config.ts`, `lib/config/index.ts`, `lib/content/index.ts`, routes, components, layout, proxy, and any existing localization files. Trace copy consumers, formatting, SEO, markdown, cart, auth, and chat boundaries before editing.

Choose the migration path from evidence:

- **Fresh simplified template:** introduce next-intl, catalogs, request config, routing, and the locale resolver using the steps below.
- **Already localized or customized:** preserve its next-intl version/configuration, catalogs, translations, rich text, providers, supported locales, domains, prefixes, locale cookies, redirects, and commerce behavior. Fill only missing pieces. Do not replace existing catalogs with template English, move routes twice, or reset the locale list to these examples. If the requested routing conflicts with existing public URLs, obtain a migration decision before changing them.
- **Mixed migration:** inventory inline copy, content functions, and catalogs. Convert only unmigrated consumers and retain modules still in use. Do not delete working translations or collapse locale-sensitive commerce/cache arguments.

Confirm the default copy locale and supported copy locales with the user. In a noninteractive run, report any unresolved choice and stop rather than choosing a routing or translation policy.

## Introduce next-intl and migrate copy

1. On a fresh installation, run `pnpm add next-intl` from the storefront root. Read the installed next-intl plugin/request/routing APIs and local Next.js guides before wiring them. If next-intl already exists, preserve its compatible version rather than reinstalling blindly.
2. Create `lib/i18n/request/server.ts` as described below, then create the plugin with `createNextIntlPlugin` from `next-intl/plugin` and the explicit request-config path. In the current template, add that plugin to the list passed to `withShopConfig(nextConfig, plugins)`; preserve the conditional `withBotId` and `withEve` entries and their existing order. Do not pass the exported async config factory to a plugin that expects a config object. Preserve customized wrapper composition, rewrites, redirects, and Cache Components settings, and do not enable optional features as part of localization.
3. Inventory inline JSX text, labels in component configuration, template literals, and reusable functions in `lib/content/index.ts`. Create the default catalog from the storefront's actual customized copy, not a template snapshot. Convert functions to equivalent ICU messages with the same parameter names, zero/one/many behavior, number formatting, rich text, and accessibility labels. Do not serialize functions into JSON or build a custom `t()` parser.
4. Create catalogs and explicit loaders for each approved locale. Keep keys and interpolation arguments aligned. Do not present an English fallback as a completed translation; agree on any temporary fallback before enabling that locale publicly.
5. Replace inline server copy and content function calls with `getTranslations()` from `next-intl/server`. Pass translated primitive labels to client leaves when possible. For interactive plurals/interpolation, wrap only the relevant leaf in a Server Component's `NextIntlClientProvider` with the namespaces it uses, then use `useTranslations()` there. Never pass the full catalog from the root layout, and never pass ordinary copy functions across the server/client boundary. Keep `components/ui/` copy-agnostic.
6. Cover error boundaries, not-found screens, metadata, email/contact text, and dynamic announcements as well as visible page headings. Components outside a provider need resolved labels or an explicitly scoped provider. Keep a minimal fallback for global errors that cannot access locale context.
7. Set `<html lang>` and UI number/date formatting from the validated copy locale. Leave `shopConfig.localization.country` and `.language` as deployment commerce settings unless Shopify content translation is explicitly requested and validated. A copy locale such as `fr-FR` does not by itself mean shipping/pricing country `FR`.
8. After all consumers are migrated and checked, remove only unused content functions. Preserve custom copy and existing catalogs. Update the installation's `AGENTS.md` to require aligned locale catalogs and scoped providers now that it is localized.

## Create the locale source of truth

On a fresh installation, create `lib/i18n/index.ts` with the user's approved locales. On an existing installation, extend its current source of truth instead. Routing, sitemap, alternates, and the switcher must read the same list. This list describes copy/routing locales, not a locale-to-currency or commerce-country map.

Example only; replace with the approved list and seed the default from the deployment's formatting locale when appropriate:

```ts
import type { Locale } from "./types";

export const locales = ["en-US", "fr-FR"] as const;
export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = locales;

export function isEnabledLocale(value: string): value is Locale {
  return enabledLocales.some((locale) => locale === value);
}
```

Define the shared `Locale` contract in `lib/i18n/types.ts`; import it directly wherever it is needed:

```ts
import type { locales } from "./index";

export type Locale = (typeof locales)[number];
```

Use domain/context files for new modules: universal routing configuration in `lib/i18n/routing/index.ts`, client navigation in `lib/i18n/navigation/client.ts`, server request configuration in `lib/i18n/request/server.ts`, and the root-param resolver in `lib/params/server.ts`. Do not add barrels or forwarding exports. Preserve working paths in an existing customized installation rather than renaming them solely to match these examples.

Validate route params, action inputs, and request payloads against this list. Retain any existing resolver and fallback policy rather than resetting it.

## What this skill turns on

1. `lib/i18n/routing/index.ts` and `lib/i18n/navigation/client.ts` (next-intl)
2. Route segment `app/[locale]/` containing every page
3. `proxy.ts` middleware running `next-intl/middleware`
4. `lib/params/server.ts` `getLocale()` reading from `next/root-params`
5. A new next-intl plugin wrapper, catalogs, and `lib/i18n/request/server.ts` loading messages by resolved locale
6. Locale-prefixed canonicals + hreflang alternates in `lib/seo/index.ts`
7. Sitemap entries per locale
8. Locale-aware Markdown negotiation in `proxy.ts`
9. `generateStaticParams` and the carried `ensureStatic` on the locale root layout
10. Add or adapt a copy-language selector without introducing a currency selector

## Cache Components compatibility — read this first

The template runs with `cacheComponents: true`, Partial Prefetching, and `export const ensureStatic = "prefetch"` on the root layout, which requires the App Shell and per-link prefetches to be static. Skipping any of these produces build errors that look unrelated:

### A. There must be no `app/layout.tsx` above `app/[locale]/`

For `[locale]` to be recognized as a root param, the dynamic segment must be the root layout. After Step 2, the file at `app/layout.tsx` should be gone (moved into `app/[locale]/layout.tsx`). If both exist, `rootParams.locale()` returns `undefined`.

### B. Carry `ensureStatic` and give `locale` static params

Move `export const ensureStatic = "prefetch"` with the root layout into `app/[locale]/layout.tsx`, and export `generateStaticParams` there for every enabled locale (Step 11). Cache Components requires at least one value for each root param; without one, the build fails:

```
Error: A required root parameter (locale) was not provided in generateStaticParams for /[locale]/cart, please provide at least one value.
```

Keep the nested `generateStaticParams` exports that return placeholder handles from `lib/static-params`; Next.js combines them with the layout's locales. A localized page or layout must not set a weaker `ensureStatic` than the locale layout:

```
A child segment cannot override a parent segment with a less-constrained `ensureStatic`.
```

### C. Keep request reads behind Suspense

Resolve locale from the root param, never from `headers()`, `cookies()`, or `searchParams` in the shell. A request read outside `<Suspense>` anywhere under the locale layout fails every localized route:

```
Error: Route "/[locale]/account/addresses": Next.js encountered uncached or runtime data during prerendering.
```

Move the read into the smallest Suspense boundary that needs it; `next build --debug-prerender` reports the source line. Do not set `export const instant = false` to silence the error: `AGENTS.md` forbids that opt-out, and it does not relax `ensureStatic`.

### D. `setRequestLocale` is not used

next-intl docs sometimes show `setRequestLocale(locale)` calls in layouts/pages. **Don't add them under cacheComponents.** That helper writes to a request-scoped store and forces dynamic rendering — it defeats the cache. The rootParams + request-config pattern below makes it unnecessary because the resolved locale is already a cache key.

### E. Keep the template `Link`

Do not replace `Link` from `@/components/ui/link` with next-intl's `Link`. The template `Link` owns intent-based prefetching, and `AGENTS.md` requires it for every internal link. Pass explicitly locale-prefixed hrefs from a Server Component using its validated locale. Middleware can redirect legacy unprefixed paths, but those redirects may negotiate a different locale and must not be the only mechanism keeping navigation in the selected language.

For Server Component redirects, use `next/navigation` and an explicitly prefixed path: `` `/${await getLocale()}/account/login` ``. `next/root-params` is not available in Server Actions or Route Handlers: receive and validate locale at those boundaries instead. Do not rely on middleware language detection to preserve the current URL locale; prefer explicit prefixed hrefs passed from the server for ordinary links.

### F. Keep server redirects outside client navigation

Do not import `lib/i18n/navigation/client.ts` into a server auth gate. Use `next/navigation`'s `redirect` (which returns `never`) and prefix the locale yourself:

```ts
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/params/server";

if (!session) redirect(`/${await getLocale()}/account/login`);
return session; // OK, narrowed
```

## Step-by-step

### Step 1: Routing config

Create `lib/i18n/routing/index.ts`:

```ts
import { defineRouting } from "next-intl/routing";
import { defaultLocale, enabledLocales } from "@/lib/i18n";

export const routing = defineRouting({
  locales: enabledLocales, // pulled from lib/i18n/index.ts — never hardcode
  defaultLocale,
  localePrefix: "always",
});
```

Create `lib/i18n/navigation/client.ts`:

```ts
"use client";

import { createNavigation } from "next-intl/navigation";
import { routing } from "@/lib/i18n/routing";

export const { usePathname, useRouter } = createNavigation(routing);
```

> Per "Cache Components compatibility E", use this navigation only in the locale switcher and other client-side programmatic routing; internal links keep the template `Link`.

### Step 2: Move routes under `app/[locale]/`

Move every route file from `app/` into `app/[locale]/`:

- `app/layout.tsx` → `app/[locale]/layout.tsx` (becomes the root layout for the locale segment). **Delete the original `app/layout.tsx` after the move** — see compatibility A above; both files cannot coexist.
- `app/page.tsx`, `app/error.tsx`, `app/not-found.tsx` → `app/[locale]/...`
- `app/account/`, `app/cart/`, `app/collections/`, `app/pages/`, `app/policies/`, `app/products/`, `app/search/` → `app/[locale]/...`

**Stay at `app/`:** `api/`, `agent/`, `md/`, `llms.txt/`, `sitemap.xml/`, `sitemap/`, `robots.ts`, `global-error.tsx`, `globals.css`, `favicon.ico`. Include blogs and any custom storefront pages in the localized route audit; do not limit the move to the example list.

In the moved layout, fix `import "./globals.css"` → `import "../globals.css"` and keep every export, including `export const ensureStatic = "prefetch"`, metadata, and viewport.

Update every `PageProps<"/foo">` and `LayoutProps<"/foo">` generic to include the locale segment: `PageProps<"/[locale]/products/[handle]">`, `LayoutProps<"/[locale]">`, etc.

### Step 3: Create `lib/params/server.ts` for Server Component root params

This is a new module on the simplified baseline. In a customized installation, preserve unrelated helpers and extend its existing resolver. Route Handlers use their route context or validated request inputs; Server Actions receive a validated locale argument, not this getter.

```ts
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { locales } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

export async function getLocale(): Promise<Locale> {
  const current = await rootLocale();
  if (!current || !locales.includes(current as Locale)) notFound();
  return current as Locale;
}
```

### Step 4: `lib/i18n/request/server.ts` loads messages by resolved locale

```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { getLocale } from "@/lib/params/server";
import type enMessages from "@/lib/i18n/messages/en.json";
import { routing } from "@/lib/i18n/routing";

const messageLoaders: Record<string, () => Promise<{ default: typeof enMessages }>> = {
  "en-US": () => import("@/lib/i18n/messages/en.json"),
  "fr-FR": () => import("@/lib/i18n/messages/fr.json"),
};

// Read the root param, not next-intl's request locale, which reads the
// `x-next-intl-locale` request header and fails the layout's static shell.
export default getRequestConfig(async () => {
  const requested = await getLocale();
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const loader = messageLoaders[locale];
  const messages = (await loader()).default as typeof enMessages;
  return { locale, messages };
});
```

### Step 5: Extend `proxy.ts`

Compose next-intl at the end of the existing proxy, where the template returns `NextResponse.next(...)`. Keep everything before that point unchanged: the `/.well-known/ucp` rewrite, Shopify route dispatch (`handleShopifyRoutes()` returns `null` synchronously when Hydrogen does not own the pathname), and Markdown negotiation (Step 9). Pass the forwarded headers through `forwardCustomerRefreshAttempt` so the account refresh marker still reaches Server Components:

```ts
const handleI18n = createMiddleware(routing);

// Keep the existing imports and add NextRequest as a runtime import.
export async function proxy(request: NextRequest): Promise<Response> {
  // Keep the template's UCP rewrite, Shopify dispatch, and Markdown negotiation here, unchanged.

  const i18nRequest = new NextRequest(request, {
    headers: forwardCustomerRefreshAttempt(
      request.nextUrl,
      requestContext.getForwardedRequestHeaders(),
    ),
  });
  const response = handleI18n(i18nRequest);
  if (markdownPath) appendVaryAccept(response.headers);
  requestContext.applyResponseHeaders(response.headers);
  if (!response.ok) return response;

  const rewriteHeader = response.headers.get("x-middleware-rewrite");
  if (!rewriteHeader) return response;

  const rewriteTarget = new URL(rewriteHeader, request.url);
  const [, ...segments] = rewriteTarget.pathname.split("/");
  const normalized = new URL(`/${segments.filter(Boolean).join("/")}`, request.url);
  normalized.search = rewriteTarget.search;
  return NextResponse.rewrite(normalized, { headers: response.headers });
}
```

Update the matcher. The template's single broad matcher is safe only while the proxy does nothing but Shopify dispatch; with locale negotiation, every request Hydrogen declines is localized, including app Route Handlers, webhooks, `robots.txt`, sitemaps, `llms.txt`, and static files. Replace it with Shopify's exact route families, locale-prefixed Shopify endpoints, and a catch-all that skips `/api`, Eve, Next.js and Vercel internals, and paths with a file extension:

```ts
export const config = {
  matcher: [
    "/api/cart",
    "/api/predictive-search",
    "/api/mcp",
    "/api/ucp/mcp",
    "/api/:apiVersion(unstable|2\\d{3}-\\d{2})/graphql.json",
    "/__shopify/:path*",
    "/.well-known/:path*",
    "/agent/:action(handoff|buyer-claims).:format",
    "/cart.:format(js|json)",
    "/cart/:operation(add|update|change|clear).:format(js|json)",
    "/:page(index|search).md",
    "/:resource(collections|products)/:handle.md",
    "/:locale([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)/agent/:action(handoff|buyer-claims).:format",
    "/:locale([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)/cart.:format(js|json)",
    "/:locale([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)/cart/:operation(add|update|change|clear).:format(js|json)",
    "/((?!api|eve(?:/|$)|_eve_internal(?:/|$)|_next/static|_next/image|_next/data|_vercel|favicon.ico|.*\\..*).*)",
  ],
};
```

Downstream applications must be able to add Route Handlers such as `/api/webhooks` or `/api/custom` without sending them through Shopify dispatch or locale middleware. If a new Hydrogen feature claims another reserved route, add that exact route family.

Keep Eve's `/eve/v1/` and `/_eve_internal/` routes outside Shopify dispatch and locale negotiation. Keep `/api/agent/session` and `/agent/ucp-profile.json` unlocalized. If Shop Agent is enabled, carry and validate the copy locale explicitly for conversation context and navigation outputs without changing the deployment's Shopify country/language or allowing client context to select a cart. Keep Next.js request/cache APIs out of Eve's runtime imports.

The file is `proxy.ts` (Next.js 16 convention), not `middleware.ts`.

### Step 6: Internal hrefs — keep the template `Link`

Per "Cache Components compatibility E", **leave existing `Link` imports from `@/components/ui/link` alone** and pass locale-prefixed hrefs from the server. Inspect product cards, menus, breadcrumbs, search, cart, and pagination so navigation retains the selected language without a negotiation redirect. Use next-intl's client navigation in the locale switcher when needed, preserving the resource and query parameters. Reuse existing localized link helpers in customized installations.

For programmatic redirects in server code, use `next/navigation`'s `redirect`:

```ts
redirect(`/${await getLocale()}/account/login`);
```

### Step 7: `lib/seo/index.ts` — locale-aware canonicals + hreflang alternates

Keep this module universal: callers resolve and validate the locale on the server, then pass it explicitly. Do not import the server root-param resolver into `index.ts`.

```ts
import { defaultLocale, enabledLocales } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

function withLocalePath(locale: string, pathname: string): string {
  const normalized = normalizePath(pathname);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function buildAlternates({
  locale,
  pathname,
  searchParams,
}: {
  locale: Locale;
  pathname: string;
  searchParams?: SearchParamsInput;
}): Metadata["alternates"] {
  const canonical = buildCanonicalPath(withLocalePath(locale, pathname), searchParams);

  const languages: Record<string, string> = {};
  for (const candidate of enabledLocales) {
    languages[candidate] = buildCanonicalPath(withLocalePath(candidate, pathname), searchParams);
  }
  languages["x-default"] = buildCanonicalPath(
    withLocalePath(defaultLocale, pathname),
    searchParams,
  );

  return { canonical, languages };
}
```

Update every caller to pass its validated locale. Server Components can call `getLocale()` from `lib/params/server.ts`; Route Handlers and Server Actions must validate their own inputs.

### Step 8: Sitemap per-locale entries

Edit `app/sitemap/[shard]/route.ts`. For every resource, emit one `<url>` per enabled locale and add `<xhtml:link rel="alternate" hreflang="..." href="..." />` siblings inside each `<url>` pointing at the other locale variants. Add `xmlns:xhtml="http://www.w3.org/1999/xhtml"` to the `<urlset>` opening tag.

```ts
import { enabledLocales } from "@/lib/i18n";

function localizePath(locale: string, pathname: string): string {
  if (pathname === "/") return `/${locale}`;
  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

// Inside renderShard(): for each item, for each locale, emit a <url> with
// a <loc> at the localized path and an <xhtml:link> per other locale.
```

`app/sitemap.xml/route.ts` (the index) doesn't need locale handling — it only lists shard URLs, which stay locale-agnostic.

### Step 9: Locale-aware Markdown negotiation

`proxy.ts` serves Markdown through `getMarkdownPath()` and `getMarkdownMirrorPath()` in `lib/markdown/representation/index.ts`, which map `/`, `/search`, `/collections/:handle`, `/products/:handle`, and their `.md` mirrors to the unlocalized `app/md/...` handlers. Teach both to accept and strip a validated locale prefix so `/:locale/products/:handle` negotiates like `/products/:handle`, and keep the localized proxy matcher covering the localized paths. Inspect the handlers before forwarding locale; introduce and validate a copy-locale input where needed rather than assuming they already read it. Keep their deployment commerce context unchanged, and preserve `?variant=` and search parameters.

### Step 10: Bare `/` and unknown locales

With `localePrefix: "always"`, next-intl's middleware redirects `/` to the negotiated locale; without the proxy change, `/` returns 404. Do not add an `app/(unlocalized)/page.tsx` fallback: a page outside `app/[locale]/` has no root layout, and the build fails with `(unlocalized)/page.tsx doesn't have a root layout`.

Unknown locales and URLs outside every route render Next.js's built-in 404 page, because no root layout applies to them. A branded page needs `app/global-not-found.tsx`, which is experimental (`experimental.globalNotFound`) in this Next.js version; add it only when the user accepts that.

### Step 11: `generateStaticParams` on the locale layout

Keep `export const ensureStatic = "prefetch"` beside it (see "Cache Components compatibility B"):

```ts
import { locales } from "@/lib/i18n";

export const generateStaticParams = async () => {
  return locales.map((locale) => ({ locale }));
};
```

### Step 12: Add or adapt the language selector

Inspect the current navigation, including any Shopify-menu customization. The simplified template does not ship a dormant `LocaleCurrencySelector` to re-enable. Add a leaf language selector, or preserve and extend an existing one. Keep the current resource and query parameters when switching. A copy-language switch must not change cart country or invent a currency choice.

## Verifying

After applying:

```bash
pnpm lint
pnpm build
pnpm dev
# In another terminal, replace locale/handle with actual supported values:
curl -I http://localhost:3000/
curl -I http://localhost:3000/products/actual-handle
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/sitemap/products-1.xml
curl http://localhost:3000/en-US
```

Smoke-test checklist:

- [ ] Lint and build pass; restart dev after route moves so route types regenerate
- [ ] The build still reports localized storefront routes as partially prerendered (◐)
- [ ] Default copy matches the pre-migration storefront, including custom text
- [ ] Every enabled catalog has matching keys and arguments; zero/one/many, interpolation, errors, and accessibility labels render correctly
- [ ] Client leaves receive only needed namespaces or primitive labels; no copy functions cross the RSC boundary
- [ ] Copy-language switching preserves Shopify country, cart identity, and currency behavior
- [ ] Existing localized installations retain translations, public URLs, providers, and custom commerce behavior
- [ ] API, OAuth, markdown, cart, and chat boundaries do not call the Server Component root-param getter
- [ ] Report which fresh and existing-installation migration paths were actually exercised; lint/build alone do not prove migration parity
- [ ] Bare `/` redirects to default locale
- [ ] Each enabled locale serves 200 at its prefix
- [ ] `<html lang>` matches the URL's locale segment
- [ ] Sitemap emits one entry per locale per page
- [ ] Canonical + hreflang alternates appear in page metadata
- [ ] Internal `Link` hrefs preserve the selected locale; legacy unprefixed public URLs still redirect correctly
