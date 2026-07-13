---
name: enable-shopify-markets
description: >
  Enable Shopify Markets with regional locales, localized Storefront API context,
  and next-intl routing. Supports locale-prefixed, invisible cookie-based, and
  per-domain routing without a separate market URL segment or market mapping.
argument-hint: "[sub-path|invisible-cookie|per-domain]"
---

# Enable Shopify Markets

Add multi-region commerce to the Vercel Shop template. A validated regional locale such as `en-US`, `en-CA`, or `fr-CA` is the complete market context: its language scopes translated content and its region scopes Shopify's country context. Do not create a separate market key, market-to-locale map, currency map, or `/market/locale` route.

Examples of valid public routing:

- Locale sub-path: `/fr-CA/products/shoe`
- Invisible cookie routing: `/products/shoe` for every locale
- Per-domain: `example.ca/fr-CA/products/shoe` or a single locale on `example.fr/products/shoe`

Never generate redundant paths such as `/ca/fr-CA/products/shoe`.

## Before editing

Read the current versions of:

- `lib/i18n/index.ts`, `lib/i18n/request.ts`, and `lib/params.ts`
- `next.config.ts` and any existing `proxy.ts`
- Every Storefront API operation and cache wrapper
- Cart creation, cart actions, and buyer identity updates
- Customer Account auth context
- Agent/chat request payload and tools
- SEO, robots, sitemap, and markdown content-negotiation routes

The template uses Next.js 16 with Cache Components. Read the installed Next.js routing/proxy docs and the installed next-intl routing types before applying examples from the web.

For any Shopify GraphQL edit, use Shopify AI Toolkit to confirm current API facts and validate the complete operation. Then follow `shopify-graphql-reference` for this template's placement, transforms, cache role, locale flow, and invalidation.

## 1. Ask for routing and locales

If the user has not already decided, ask which strategy they want:

1. **Locale sub-path** — one regional locale segment, such as `/en-US/...` and `/fr-CA/...`.
2. **Invisible cookie** — all public paths stay clean; next-intl internally rewrites `/products/...` to `/[locale]/products/...` using the locale cookie.
3. **Per-domain** — domains select the available/default locale context; paths may be prefixed only when a domain supports multiple languages.

For sub-path routing, ask whether the default locale should be:

- `as-needed`: `/products/...` for the default and `/fr-CA/products/...` for others
- `always`: `/en-US/products/...` and `/fr-CA/products/...`

Then ask for the default locale and all enabled locales. Require regional BCP 47 tags with both language and region. For example:

```text
en-US, en-CA, fr-CA, de-DE
```

Do not accept bare language tags such as `en` or `fr` for Markets mode. Do not ask for a separate market identifier or currency.

Before choosing invisible cookie routing, state its SEO tradeoff: every locale shares one canonical URL, so search engines and shared links cannot target a specific cookie-selected version. Use locale sub-paths or per-domain URLs when each localized version must be independently indexed.

## 2. Make regional locales the source of truth

Update `lib/i18n/index.ts` so the locale list is the only market configuration:

```ts
export const locales = ["en-US", "en-CA", "fr-CA"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = locales;
export const localeSwitchingEnabled = enabledLocales.length > 1;
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
```

Keep boundary validation through `isEnabledLocale` / `resolveLocale`. Derive Shopify context directly from the validated locale:

```ts
export function getCountryCode(locale: Locale): string {
  return new Intl.Locale(locale).region ?? new Intl.Locale(defaultLocale).region ?? "US";
}

export function getLanguageCode(locale: Locale): string {
  return new Intl.Locale(locale).language.toUpperCase();
}
```

Prefer `Locale` over `string` for internal locale parameters. Request bodies, cookies, headers, route params, and query params remain untrusted strings until validated.

### Currency rule

Currency always comes from Shopify's localized response (`MoneyV2.currencyCode`, cart cost, product prices, etc.). Never infer currency from locale and never add `localeCurrency`, `marketCurrency`, or a locale-to-currency lookup.

When UI outside a price object needs a currency code, pass one from fetched Shopify data. If Shopify returns no product or cart from which to derive it, omit currency-specific UI rather than guessing.

## 3. Add message catalogs

Add a message loader and catalog for every enabled locale. Reuse a language catalog only intentionally; for example, `en-US` and `en-CA` may share `en.json` while Shopify still receives distinct country contexts.

Validate every generated JSON file after writing it. Keep all locale catalogs structurally aligned.

## 4. Configure routing

Create `lib/i18n/routing.ts` and use `enabledLocales` directly. There is no market mapping layer.

### Locale sub-path

```ts
import { defineRouting } from "next-intl/routing";

import { defaultLocale, enabledLocales, LOCALE_COOKIE_NAME } from ".";

export const routing = defineRouting({
  defaultLocale,
  localeCookie: { name: LOCALE_COOKIE_NAME, sameSite: "lax" },
  localePrefix: "as-needed", // or "always"
  locales: enabledLocales,
});
```

Use full regional locale prefixes. One segment is enough.

### Invisible cookie routing

```ts
import { defineRouting } from "next-intl/routing";

import { defaultLocale, enabledLocales, LOCALE_COOKIE_NAME } from ".";

export const routing = defineRouting({
  alternateLinks: false,
  defaultLocale,
  localeCookie: { name: LOCALE_COOKIE_NAME, sameSite: "lax" },
  localeDetection: true,
  localePrefix: "never",
  locales: enabledLocales,
});
```

`localePrefix: "never"` keeps the locale segment internal. On a request for `/products/shoe`, next-intl resolves the cookie (or first-visit language preference/default), then rewrites internally to a route such as `/fr-CA/products/shoe`. The browser URL stays `/products/shoe`.

Do not implement a second custom market rewrite on top of this. The internal `[locale]` segment is an implementation detail, not a public URL.

### Per-domain routing

```ts
export const routing = defineRouting({
  defaultLocale,
  domains: [
    { defaultLocale: "en-US", domain: "example.com", locales: ["en-US"] },
    { defaultLocale: "en-CA", domain: "example.ca", locales: ["en-CA", "fr-CA"] },
  ],
  localeCookie: { name: LOCALE_COOKIE_NAME, sameSite: "lax" },
  localePrefix: "as-needed",
  locales: enabledLocales,
});
```

The domain configuration is routing configuration, not a separate commerce market model. Shopify country and language still derive from the resolved regional locale.

Create client navigation exports only for components that explicitly switch locales:

```ts
import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

export const { usePathname, useRouter } = createNavigation(routing);
```

Do not replace every `next/link` import in the Server Component tree. Keep ordinary links request-independent under Cache Components.

## 5. Move page routes under `app/[locale]/`

Move the root layout and all localized pages under `app/[locale]/`. The locale layout must be the root layout; do not leave `app/layout.tsx` above it.

Move:

- `app/layout.tsx` to `app/[locale]/layout.tsx`
- Page routes such as home, products, collections, search, cart, and account into `app/[locale]/...`

Keep these unlocalized at `app/`:

- `api/`
- markdown route handlers under `md/`
- `robots.ts`
- `sitemap.xml/` and `sitemap/`
- `globals.css`, `global-error.tsx`, and static metadata files

Update typed route generics to include `[locale]`, fix the moved `globals.css` import, and add locale values to every `instant.unstable_samples[].params` object.

Do not call `setRequestLocale` with Cache Components. Resolve locale through the root param so locale becomes an explicit route/cache input.

## 6. Resolve locale from the root param

Update `lib/params.ts`:

```ts
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { isEnabledLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const value = await rootLocale();
  if (!value || !isEnabledLocale(value)) notFound();
  return value;
}
```

Update `lib/i18n/request.ts` to call `getLocale()` and load the matching messages. Do not resolve locale by reading cookies or request headers from a cached component. The proxy owns request negotiation; React receives the validated internal route param.

## 7. Add the proxy

Create root `proxy.ts`:

```ts
import createMiddleware from "next-intl/middleware";

import { routing } from "@/lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!.well-known|api|md|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap/|.*\\..*).*)",
  ],
};
```

The exact exclusions must match the current checkout. Keep API, webhooks, sitemap, robots, static assets, and markdown handlers out of locale routing.

For invisible cookie routing, direct public locale-prefixed URLs should canonicalize back to the clean path. next-intl's `never` mode handles this; do not expose the internal rewrite destination in links, metadata, or redirects.

## 8. Propagate locale through commerce

Audit definitions and real callers. Every localized Storefront API operation must accept the validated `Locale`, derive `country` and `language`, and use Shopify's `@inContext(country: $country, language: $language)`.

This includes:

- products, collections, search, recommendations, and complementary products
- navigation menus and any megamenu added by `enable-shopify-menus`
- cart creation and cart reads that depend on buyer country
- sitemap and markdown catalog/product output
- agent tools and Storefront MCP calls

Cached functions must receive `locale` explicitly. Never read the locale cookie, `headers()`, or `cookies()` inside a `"use cache"` function. The locale argument naturally separates cache entries; do not add a parallel market cache key.

Keep locale defaults only at compatibility boundaries where the base single-locale template needs them. Once a route has resolved locale, pass it explicitly rather than silently defaulting deeper in the stack.

### Menus

Change `getMenu({ handle })` to `getMenu({ handle, locale })`, add localized Storefront context to the validated query, and update every caller. Without this, navigation remains pinned to the default market.

### Customer Account auth

Pass the active `Locale` into the Shopify/Hydrogen request context instead of using `defaultLocale`. Preserve locale across login, authorize, refresh, and logout return URLs. Validate any locale carried through OAuth state or URL params.

### Chat and agent API

The chat route lives outside `[locale]`, and invisible URLs do not reveal locale in the referer. Send the current locale explicitly in the client request payload, validate it in `app/api/chat/route.ts`, and put it in agent context. Do not infer it from URL segments or fall back unconditionally to `defaultLocale`.

Agent tools, Storefront MCP calls, product context, cart creation, and navigation outputs must use that validated locale.

### Markdown negotiation

After the proxy rewrite, localized page routes have an internal `/:locale/...` path even in invisible mode. Update content-negotiation rewrites so the locale reaches unlocalized `app/md/...` handlers as a validated query/header value. Preserve `?variant=` and search parameters.

## 9. Switch locale and synchronize cart country

Switching language within the same country must not mutate buyer identity:

- `fr-CA` to `en-CA`: set locale; no cart country update
- `en-CA` to `en-US`: set locale and update buyer country to `US`

Keep the mutation in a server action, validate both inputs, and rely on `updateCartBuyerIdentity` to invalidate cart cache:

```ts
"use server";

import { cookies } from "next/headers";

import { getCountryCode, isEnabledLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n";
import { updateCartBuyerIdentity } from "@/lib/shopify/operations/cart";

export async function switchLocaleAction(currentValue: string, nextValue: string) {
  if (!isEnabledLocale(currentValue) || !isEnabledLocale(nextValue)) {
    return { error: "Unsupported locale", success: false } as const;
  }

  if (getCountryCode(currentValue) !== getCountryCode(nextValue)) {
    await updateCartBuyerIdentity(nextValue);
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, nextValue, {
    path: "/",
    sameSite: "lax",
  });

  return { success: true } as const;
}
```

The selector remains a leaf Client Component.

- **Sub-path/per-domain:** call the action, then use next-intl's client router to replace the current pathname with `{ locale: nextLocale }`.
- **Invisible cookie:** call the action, then call `router.refresh()`. The pathname must not change.

Do not offer a separate currency selector unless the store has a Shopify-backed currency choice independent of country. Display currency from cart/product responses.

## 10. Strategy-specific SEO and sitemap behavior

### Locale sub-path or per-domain

Each locale has a distinct indexable URL:

- Canonical points to the current locale URL.
- Emit `hreflang` alternates for enabled locale URLs plus `x-default`.
- Emit one sitemap URL per locale with matching XHTML alternates.
- Build URLs from the selected routing strategy; do not assume every strategy uses `/${locale}`.

### Invisible cookie

All variants share one public URL:

- Canonical is the clean public path.
- Do not emit fake locale-specific `hreflang` URLs.
- Emit one sitemap URL per resource, not one per locale.
- Keep `alternateLinks: false` in next-intl routing.
- Treat localization as personalization. Shared links and crawlers without the user's cookie receive negotiated/default content.

Never put internal `/[locale]/...` rewrite targets into metadata or sitemap XML.

## 11. Verification

Run focused checks from `apps/template`:

```bash
pnpm codegen
pnpm lint
pnpm build
```

Then run the app and verify the selected strategy.

### All strategies

- Every enabled regional locale produces the expected Shopify country/language context.
- Product and cart currency codes come from Shopify responses.
- Cache entries do not leak products, prices, menus, or cart state between locales.
- `fr-CA` to `en-CA` does not update buyer country.
- `en-CA` to `en-US` updates buyer country and invalidates cart cache.
- Chat/agent operations receive the explicit validated locale.
- Markdown responses use the same locale as HTML responses.
- Variant and filter query parameters survive switching and rewrites.

### Locale sub-path

- Locale URLs serve directly with no `/market/locale` nesting.
- Default-prefix behavior matches `always` or `as-needed`.
- Canonical, hreflang, and sitemap URLs are locale-specific.

### Invisible cookie

```bash
curl -I http://localhost:3000/products/example
curl -I --cookie "NEXT_LOCALE=fr-CA" http://localhost:3000/products/example
```

- Both requests keep `/products/example` as the public URL.
- The cookie-selected response has `<html lang="fr-CA">` and Shopify country `CA` context.
- Locale switching changes content/cart context without changing the address bar.
- `/fr-CA/products/example` does not remain a public canonical URL.
- Metadata and sitemap contain only clean public paths and no locale alternates.

### Per-domain

- Each configured host resolves its allowed/default locales.
- Cross-domain locale switching uses the correct host.
- Canonical and hreflang URLs contain the production domains.
