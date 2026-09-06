---
name: enable-shopify-markets
description: >
  Enable Shopify Markets with regional locales, localized Storefront API context,
  and next-intl routing. Supports locale-prefixed, invisible cookie-based, and
  per-domain routing without a separate market URL segment or market mapping.
argument-hint: "[sub-path|invisible-cookie|per-domain]"
---

# Enable Shopify Markets

Add multi-region commerce to the Vercel Shop template. The fresh baseline is one deployment with clean URLs, inline component copy and reusable functions in `lib/content/index.ts`, and explicit `shopConfig.localization = { country: "US", language: "EN", locale: "en-US" }`. It does not include next-intl, catalogs, `lib/i18n/`, or a `lib/params.ts` locale resolver.

Copy translation and commerce market selection are separate concerns. This skill's regional-locale strategy deliberately combines them: a validated `en-US`, `en-CA`, or `fr-CA` selects translated copy plus Shopify country/language context. Confirm that coupling fits the store before adopting it. Do not infer a shopper's commerce country merely from a copy locale introduced by `enable-i18n`. Preserve existing installations that intentionally separate language and country; do not force them into this example model.

For a new regional-locale implementation, do not invent a separate market key, redundant market-to-locale map, currency map, or `/market/locale` route. Existing custom market models need an explicit migration decision, not automatic removal.

Examples of valid public routing:

- Locale sub-path: `/fr-CA/products/shoe`
- Invisible cookie routing: `/products/shoe` for every locale
- Per-domain: `example.ca/fr-CA/products/shoe` or a single locale on `example.fr/products/shoe`

Never generate redundant paths such as `/ca/fr-CA/products/shoe`.

## Before editing

Read the current versions of:

- `package.json`, `lib/config.ts`, `lib/content/index.ts`, and inline copy throughout routes and components
- Existing `lib/i18n/`, catalogs, next-intl plugin/providers, locale resolvers, and localized routes if present; these do not exist on the fresh baseline
- `next.config.ts` and any existing `proxy.ts`
- Every Storefront API operation and cache wrapper
- Cart creation, cart actions, and buyer identity updates
- Customer Account auth context
- Agent/chat request payload and tools
- SEO, robots, sitemap, and markdown content-negotiation routes

The template uses Next.js 16 with Cache Components. Read the installed Next.js routing/proxy/root-param docs. Install next-intl only when missing, then read its installed plugin, request-config, and routing APIs before editing.

Classify the installation before proceeding:

- **Fresh simplified template:** follow the next-intl installation and copy-to-catalog migration in `enable-i18n`, then use this skill's selected routing strategy and commerce propagation instead of its copy-only rules.
- **Already localized/customized:** preserve existing catalogs, translations, copy functions not yet migrated, scoped providers, public URLs, domains, cookies, redirects, and commerce/cache contracts. Extend only missing functionality; do not reinstall next-intl blindly, reset supported locales, replace custom copy with template English, or move routes twice.
- **Copy-only i18n already enabled:** keep its translations and routing. Identify the existing fixed commerce country/language before introducing regional selection. Obtain approval for any new coupling or changed public URLs.

Inventory mixed copy/catalog consumers and retain modules still in use. Preserve intentional operation locale/cache inputs even where the new default no longer passes locale through presentation. In a noninteractive run, stop and report unresolved routing or market-model choices rather than choosing for the user.

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

For a fresh regional-locale implementation, create `lib/i18n/index.ts` with the approved list and seed the initial context from `shopConfig.localization`. If its explicit country/language and formatting locale disagree, resolve that deliberately instead of deriving a different market silently. For an existing implementation, extend its current source of truth without resetting values.

The following is an example of the opted-in regional-locale model, not a replacement for every store's custom configuration:

```ts
export const locales = ["en-US", "en-CA", "fr-CA"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = locales;
export const localeSwitchingEnabled = enabledLocales.length > 1;
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isEnabledLocale(value: string): value is Locale {
  return enabledLocales.some((locale) => locale === value);
}
```

Create boundary validation such as `isEnabledLocale` on the fresh baseline; retain existing `isEnabledLocale` / `resolveLocale` behavior where present. Reject unsupported request values instead of casting arbitrary strings to `Locale`. For the approved regional-locale strategy, derive Shopify context from the validated locale:

```ts
import type { CommerceLocale } from "@/lib/config";

export function getCountryCode(locale: Locale): CommerceLocale["country"] {
  const country = new Intl.Locale(locale).region;
  if (country === "US" || country === "CA") return country;
  throw new Error(`Unsupported commerce country: ${country}`);
}

export function getLanguageCode(locale: Locale): CommerceLocale["language"] {
  const language = new Intl.Locale(locale).language.toUpperCase();
  if (language === "EN" || language === "FR") return language;
  throw new Error(`Unsupported commerce language: ${language}`);
}

export function getCommerceLocale(locale: Locale): CommerceLocale {
  return { country: getCountryCode(locale), language: getLanguageCode(locale) };
}
```

These guards cover only the example locale list above. Extend them deliberately for the store's approved countries and languages; reject unsupported values rather than asserting them into Shopify types. Pass `getCommerceLocale(locale)` to operation `locale` options.

Prefer `Locale` over `string` for internal routing locale parameters. Request bodies, cookies, headers, route params, and query params remain untrusted strings until validated. Validate the country/language conversion against Shopify's supported values with Shopify AI Toolkit; do not assume uppercasing every BCP 47 language produces a valid Shopify language code.

The simplified transport's operation `locale` option is a `CommerceLocale` object (`{ country, language }` from `lib/config.ts`), not a BCP 47 string. Convert once at the validated commerce boundary and propagate that object through existing operation/cache inputs. Keep the copy/routing `Locale` string distinct. For an older customized transport, adapt its actual signature instead of replacing it wholesale.

### Currency rule

Currency always comes from Shopify's localized response (`MoneyV2.currencyCode`, cart cost, product prices, etc.). Never infer currency from locale and never add `localeCurrency`, `marketCurrency`, or a locale-to-currency lookup.

When UI outside a price object needs a currency code, pass one from fetched Shopify data. If Shopify returns no product or cart from which to derive it, omit currency-specific UI rather than guessing.

## 3. Install next-intl and migrate copy

Use the `enable-i18n` section "Introduce next-intl and migrate copy" for the full migration. On a fresh storefront, run `pnpm add next-intl`, create its request config, and compose `createNextIntlPlugin` from `next-intl/plugin` around the existing Next config with the explicit request-config path. Preserve other wrappers, rewrites, and Cache Components settings. Do not apply copy-only commerce rules or force `localePrefix: "always"` when using this Markets skill.

Build the initial catalog from the installation's actual inline copy, component configuration labels, and reusable functions in `lib/content/index.ts`. Convert typed interpolation and plural functions to equivalent ICU messages, preserving parameters, zero/one/many behavior, rich text, errors, and accessibility labels. Do not serialize functions or write a custom `t()` parser. Preserve already translated/customized catalogs rather than regenerating them from the template.

Use server `getTranslations()` and primitive labels by default. Only interactive leaves that need runtime messages use `useTranslations()` under narrowly scoped `NextIntlClientProvider` boundaries. Do not ship full catalogs at the root or pass copy functions across the RSC boundary. Include metadata, error/not-found screens, and formatting in the migration. Remove shared content functions only after all their consumers have migrated; update the installation's `AGENTS.md` for its now-localized architecture.

Add an explicit message loader and catalog for every enabled copy locale. Reuse a language catalog only intentionally; for example, `en-US` and `en-CA` may share `en.json` while Shopify still receives distinct country contexts. Commerce context does not translate storefront labels automatically.

Validate every generated JSON file and keep keys and interpolation arguments aligned. Agree on temporary fallbacks before publishing a locale with incomplete copy; never silently label fallback English as a complete translation.

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

Do not replace every `next/link` import in the Server Component tree. Pass explicit strategy-aware hrefs from the server so ordinary links preserve the selected locale without request-context reads in link components. Keep public paths clean in invisible-cookie mode.

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

Update typed route generics to include `[locale]`, fix the moved `globals.css` import, and add locale values to every `instant.unstable_samples[].params` object. Export `generateStaticParams` from the locale root layout using `enabledLocales.map((locale) => ({ locale }))`; Cache Components requires at least one root-param value. Preserve any existing generation logic and restart dev after route moves to regenerate root-param types.

Do not call `setRequestLocale` with Cache Components. Resolve locale through the root param so locale becomes an explicit route/cache input.

## 6. Resolve locale from the root param

Create `lib/params.ts` on the fresh baseline, or extend the existing resolver without overwriting unrelated helpers. This getter is for Server Components only:

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

Create or update `lib/i18n/request.ts` to call `getLocale()` and load the matching messages. Do not resolve locale by reading cookies or request headers from a cached component. The proxy owns request negotiation; React receives the validated internal route param. Set `<html lang>` and UI formatting from that locale.

Do not call this root-param getter from Route Handlers or Server Actions: use route context or explicit request/action inputs and validate them at the boundary. Keep API, OAuth, markdown, and chat handling outside the Server Component request config.

## 7. Extend the proxy

Compose next-intl after the existing Shopify route dispatch. `handleShopifyRoutes()` returns `null` synchronously when Hydrogen does not own the pathname, so return its promise when present and run locale negotiation only after it declines the request:

```ts
const handleI18n = createMiddleware(routing);

// Keep the existing imports and add NextRequest as a runtime import.
export async function proxy(request: NextRequest): Promise<Response> {
  const requestContext = createCustomerRequestContext(request);
  const shopifyRoute = handleShopifyRoutes({
    // Preserve the template's handlers, session manager, and storefront client.
    request,
    requestContext,
  });
  if (shopifyRoute) return shopifyRoute;

  const i18nRequest = new NextRequest(request, {
    headers: requestContext.getForwardedRequestHeaders(),
  });
  const response = handleI18n(i18nRequest);
  requestContext.applyResponseHeaders(response.headers);
  return response;
}
```

Preserve the complete Shopify options from the current proxy rather than copying the abbreviated example literally. Keep its existing Shopify-owned API and protocol matchers, then add locale-prefixed Shopify endpoints now that locale routing is enabled:

```ts
export const config = {
  matcher: [
    // Keep every matcher already present in the template.
    "/:locale([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)/agent/:action(handoff|buyer-claims).:format",
    "/:locale([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)/cart.:format(js|json)",
    "/:locale([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)/cart/:operation(add|update|change|clear).:format(js|json)",
  ],
};
```

Never widen the matcher to `/api/:path*`: application Route Handlers such as `/api/webhooks`, `/api/chat`, and `/api/custom` remain owned by Next unless explicitly reserved for Hydrogen. Add exact route families when a new Shopify integration requires proxy handling.

For invisible cookie routing, direct public locale-prefixed URLs should canonicalize back to the clean path. next-intl's `never` mode handles this; do not expose the internal rewrite destination in links, metadata, or redirects.

## 8. Propagate locale through commerce

Audit definitions and real callers. Under the opted-in regional-locale model, localized Storefront API operations receive validated locale/context, derive country and language at the commerce boundary, and use Shopify's validated `@inContext(country: $country, language: $language)`. Inspect existing operation signatures before adding arguments: locale and cache inputs may already exist intentionally even though default UI locale plumbing was removed. Preserve an existing explicitly separated country/language model rather than repurposing its copy locale.

This includes:

- products, collections, search, recommendations, and complementary products
- navigation menus and any megamenu added by `enable-shopify-menus`
- cart creation and cart reads that depend on buyer country
- sitemap and markdown catalog/product output
- agent tools and Storefront MCP calls

Cached functions must receive `locale` explicitly. Never read the locale cookie, `headers()`, or `cookies()` inside a `"use cache"` function. The locale argument naturally separates cache entries; do not add a parallel market cache key.

Keep locale defaults only at compatibility boundaries where the base single-locale template needs them. Once a route has resolved locale, pass it explicitly rather than silently defaulting deeper in the stack.

### Menus

Inspect `getMenu` and its callers; where needed, extend `getMenu({ handle })` to receive the validated commerce context, add localized Storefront context to the validated query, and update every caller. Without this, navigation remains pinned to the default market.

### Customer Account auth

Pass the active validated commerce context into the Shopify/Hydrogen request context instead of pinning it to `shopConfig.localization` or an older `defaultLocale`. Preserve locale across login, authorize, refresh, and logout return URLs. Validate any locale carried through OAuth state or URL params.

### Chat and agent API

The chat route lives outside `[locale]`, and invisible URLs do not reveal locale in the referer. Send the current locale explicitly in the client request payload, validate it in `app/api/chat/route.ts`, and put it in agent context. Do not infer it from URL segments or fall back unconditionally to `defaultLocale`.

Agent tools, Storefront MCP calls, product context, cart creation, and navigation outputs must use that validated locale.

### Markdown negotiation

After the proxy rewrite, localized page routes have an internal `/:locale/...` path even in invisible mode. Update content-negotiation rewrites so the locale reaches unlocalized `app/md/...` handlers as a validated query/header value. Preserve `?variant=` and search parameters.

## 9. Switch locale and synchronize cart country

Switching language within the same country must not mutate buyer identity:

- `fr-CA` to `en-CA`: set locale; no cart country update
- `en-CA` to `en-US`: set locale and update buyer country to `US`

Keep the mutation in a server action, validate both inputs, and update the cart's buyer identity directly — read the cart id from the shared `cart` cookie and issue `cartBuyerIdentityUpdate` through `storefront.request`:

```ts
"use server";

import { gql } from "@shopify/hydrogen";
import type { CountryCode } from "@shopify/hydrogen/storefront-api-types";
import { cookies } from "next/headers";

import { getCartIdFromCookie } from "@/lib/cart/server";
import { getCountryCode, isEnabledLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n";
import { storefront } from "@/lib/shopify/storefront";

const BUYER_IDENTITY_MUTATION = gql(`#graphql
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
      }
    }
  }
`);

export async function switchLocaleAction(currentValue: string, nextValue: string) {
  if (!isEnabledLocale(currentValue) || !isEnabledLocale(nextValue)) {
    return { error: "Unsupported locale", success: false } as const;
  }

  if (getCountryCode(currentValue) !== getCountryCode(nextValue)) {
    const cartId = await getCartIdFromCookie();
    if (cartId) {
      await storefront.request(BUYER_IDENTITY_MUTATION, {
        variables: {
          buyerIdentity: { countryCode: getCountryCode(nextValue) as CountryCode },
          cartId,
        },
      });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, nextValue, {
    path: "/",
    sameSite: "lax",
  });

  return { success: true } as const;
}
```

`getCartIdFromCookie()` (in `lib/cart/server.ts`) reads the shared `cart` cookie and returns the full `gid://shopify/Cart/...` id, so the action reuses the same format the Hydrogen handlers write.

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

- Default-language copy matches the pre-migration installation, including custom text, interpolation, plurals, errors, and accessibility labels.
- Every enabled catalog has aligned keys/arguments and scoped client providers; fallback text is not mistaken for completed translation.
- Existing localized installations retain translations, custom routing, and their approved commerce model.
- Report whether the fresh-baseline migration and an existing-localized migration were actually exercised; static checks cannot prove either path's parity.
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
