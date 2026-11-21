---
name: enable-shopify-markets
description: >
  Enable Shopify Markets with regional locales, localized Storefront API context,
  and next-intl routing. Supports locale-prefixed, invisible cookie-based, and
  per-domain routing without a separate market URL segment or market mapping.
  Use when the user wants region-aware prices, currencies, inventory, or multiple
  Shopify markets in the storefront.
---

# Enable Shopify Markets

Add multi-region commerce to the Vercel Shop template. The fresh baseline is one deployment with clean URLs, inline copy in `lib/content/index.ts`, and explicit `shopConfig.localization = { country: "US", language: "EN", locale: "en-US" }`; it has no next-intl, catalogs, `lib/i18n/`, or `lib/params/server.ts`.

Copy translation and commerce market selection are separate concerns. This skill's regional-locale strategy deliberately combines them: a validated `en-US`, `en-CA`, or `fr-CA` selects translated copy plus Shopify country/language context. Confirm that coupling fits the store before adopting it. Do not infer a shopper's commerce country merely from a copy locale introduced by `enable-i18n`. Preserve existing installations that intentionally separate language and country; do not force them into this example model. A copy-only i18n installation keeps its translations and routing: identify its existing fixed commerce country/language before adding regional selection, and get approval for new coupling or changed public URLs. In a noninteractive run, stop and report unresolved routing or market-model choices instead of choosing for the user.

For a new regional-locale implementation, do not invent a separate market key, redundant market-to-locale map, currency map, or `/market/locale` route. Existing custom market models need an explicit migration decision, not automatic removal.

Examples of valid public routing:

- Locale sub-path: `/fr-CA/products/shoe`
- Invisible cookie routing: `/products/shoe` for every locale
- Per-domain: `example.ca/fr-CA/products/shoe` or a single locale on `example.fr/products/shoe`

Never generate redundant paths such as `/ca/fr-CA/products/shoe`.

`enable-i18n` owns the copy and routing mechanics: inspection, next-intl install and plugin, catalogs, the move into `app/[locale]`, `getLocale()`, request config, Cache Components traps, proxy composition and matcher, and `buildAlternates`. Run its steps first and keep its rules; this skill adds the market model.

For any Shopify GraphQL edit, use Shopify AI Toolkit to confirm current API facts and validate the complete operation, then follow `shopify-graphql-reference` for this template's placement, transforms, cache role, locale flow, and invalidation. Read every Storefront API operation and cache wrapper, cart creation and buyer identity updates, Customer Account auth context, the agent request payload and tools, and the SEO, sitemap, and markdown routes, since each carries commerce context.

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

Create `lib/i18n/index.ts` as `enable-i18n` "Create the locale source of truth" describes, using regional tags and the cookie every routing mode below reads. Seed the initial context from `shopConfig.localization`; if its explicit country/language and formatting locale disagree, resolve that deliberately instead of deriving a different market silently. Extend an existing source of truth without resetting values, and reuse that section's `Locale` contract, module paths, `isEnabledLocale`, and boundary validation.

```ts
import type { Locale } from "./types";

export const locales = ["en-US", "en-CA", "fr-CA"] as const;

export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = locales;
export const localeSwitchingEnabled = enabledLocales.length > 1;
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
```

For the approved regional-locale strategy, derive Shopify context from the validated locale:

```ts
import type { CommerceLocale } from "@/lib/config/types";

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

These guards cover only the example locale list. Extend them deliberately for the store's approved countries and languages, and reject unsupported values rather than asserting them into Shopify types; validate the conversion with Shopify AI Toolkit instead of assuming uppercasing a BCP 47 language yields a valid Shopify language code. Pass `getCommerceLocale(locale)` to operation `locale` options.

Prefer `Locale` over `string` for internal routing locale parameters. Request bodies, cookies, headers, route params, and query params remain untrusted strings until validated: retain existing `isEnabledLocale`/`resolveLocale` behavior, and reject unsupported values instead of casting them to `Locale`.

The transport's operation `locale` option is a `CommerceLocale` object (`{ country, language }` from `lib/config/types.ts`), not a BCP 47 string. Convert once at the validated commerce boundary and propagate that object through existing operation/cache inputs. Keep the copy/routing `Locale` string distinct. For an older customized transport, adapt its actual signature instead of replacing it wholesale.

### Currency rule

Currency always comes from Shopify's localized response (`MoneyV2.currencyCode`, cart cost, product prices, etc.). Never infer currency from locale and never add `localeCurrency`, `marketCurrency`, or a locale-to-currency lookup.

When UI outside a price object needs a currency code, pass one from fetched Shopify data. If Shopify returns no product or cart from which to derive it, omit currency-specific UI rather than guessing.

## 3. Install next-intl and migrate copy

Follow `enable-i18n` "Introduce next-intl and migrate copy" and its request-config step: the plugin through `withShopConfig`, catalogs built from actual inline copy, `getTranslations()`, scoped `NextIntlClientProvider` boundaries, metadata and error screens, and removing content functions only after their consumers migrate. Do not apply its copy-only commerce rules or force `localePrefix: "always"`.

Markets deltas: add an explicit message loader and catalog for every enabled copy locale. `en-US` and `en-CA` may share `en.json` while Shopify still receives distinct country contexts; commerce context does not translate storefront labels. Validate every generated JSON file, keep keys and interpolation arguments aligned, and agree on temporary fallbacks before publishing a locale with incomplete copy rather than labelling fallback English as a complete translation.

## 4. Configure routing

Create `lib/i18n/routing/index.ts` with `enabledLocales` directly; there is no market mapping layer. Use `enable-i18n` Step 1 for the navigation client.

### Locale sub-path

```ts
import { defineRouting } from "next-intl/routing";

import { defaultLocale, enabledLocales, LOCALE_COOKIE_NAME } from "@/lib/i18n";

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

import { defaultLocale, enabledLocales, LOCALE_COOKIE_NAME } from "@/lib/i18n";

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

Keep `Link` from `@/components/ui/link` for internal links; never next-intl's `Link`. Pass explicit strategy-aware hrefs from the server so ordinary links preserve the selected locale without request-context reads in link components, and keep public paths clean in invisible-cookie mode.

## 5. Move routes and resolve the locale

Move the routes as `enable-i18n` Step 2 describes, keeping the paths it lists unlocalized. Export `generateStaticParams` from the locale root layout with `enabledLocales.map((locale) => ({ locale }))` and keep every moved export, including `export const ensureStatic = "prefetch"`.

Use `enable-i18n` Step 3 for `getLocale()` and its request-config step for message loading. Resolve locale from the root param, never from cookies or headers in a cached component, and do not add next-intl's `setRequestLocale` under Cache Components. Do not call that getter from Route Handlers or Server Actions. Keep API, OAuth, markdown, and chat handling outside the Server Component request config. `enable-i18n` "Cache Components compatibility" and Step 10 list the resulting build errors and bare-`/` behavior.

## 6. Extend the proxy

Hydrogen's handlers take their market from the request context's `i18n`: every cart, predictive search, and account operation they run uses `@inContext(country, language)` from it. The template pins that context to `shopConfig.localization` in `createCustomerRequestContext` (`lib/auth/request.ts`) and in the server cart seed (`lib/cart/server.ts`). Accept the validated commerce context in both instead. Resolve the locale before Shopify dispatch (`resolveRequestLocale`, built on `isEnabledLocale`): from the validated locale prefix when the path has one, otherwise the validated locale cookie (unprefixed handler paths such as `/api/cart` carry no locale segment), otherwise `defaultLocale`.

Compose next-intl after Shopify dispatch, the refine 404, and Markdown negotiation exactly as `enable-i18n` Step 5 shows. The one Markets change is the context built before dispatch:

```ts
const locale = resolveRequestLocale(request);
const requestContext = createCustomerRequestContext(request, getCommerceLocale(locale));
// Keep the template's customerSession, isAuthPath, routeOptions, Shopify dispatch,
// refine 404, and Markdown negotiation, then compose next-intl as enable-i18n Step 5 shows.
```

Use the matcher printed in `enable-i18n` Step 5; it is the same for all three routing modes and keeps app Route Handlers, webhooks, Eve, and static files out of locale negotiation. In invisible-cookie mode, next-intl's `never` mode canonicalizes direct locale-prefixed URLs back to the clean path; do not expose the internal rewrite destination in links, metadata, or redirects.

## 7. Propagate locale through commerce

Audit definitions and real callers. Under the opted-in regional-locale model, localized Storefront API operations receive validated locale/context, derive country and language at the commerce boundary, and use Shopify's validated `@inContext(country: $country, language: $language)`. Inspect existing locale and cache inputs before adding arguments, and preserve intentional inputs even where presentation does not use them. Preserve an explicitly separated country/language model rather than repurposing its copy locale.

This includes:

- products, collections, search, recommendations, and complementary products
- navigation menus added by `enable-shopify-menus`
- cart creation and cart reads that depend on buyer country
- sitemap and markdown catalog/product output
- agent tools and Storefront MCP calls

Cached functions must receive `locale` explicitly. Never read the locale cookie, `headers()`, or `cookies()` inside a `"use cache"` function. The locale argument naturally separates cache entries; do not add a parallel market cache key.

Keep locale defaults only at compatibility boundaries where the base single-locale template needs them. Once a route has resolved locale, pass it explicitly rather than silently defaulting deeper in the stack.

### Menus

If `enable-shopify-menus` has added `getMenu`, pass the validated commerce context as `getMenu({ handle, locale })` from every caller; its query already carries `@inContext`. Without this, navigation remains pinned to the default market.

### Customer Account auth

Pass the active validated commerce context into the Shopify/Hydrogen request context instead of pinning it to `shopConfig.localization` or an older `defaultLocale`. Preserve locale across login, authorize, refresh, and logout return URLs. Validate any locale carried through OAuth state or URL params.

### Chat and agent API

Shop Agent is disabled by default. Preserve that setting; enabling Markets must not enable chat. When chat is enabled, inspect `agent/channels/eve.ts`, `agent/tools/`, `agent/lib/`, and the Shopify connections rather than adding an app-owned chat route or commerce HTTP bridge.

Eve's session routes live outside `[locale]`, and invisible URLs do not reveal locale in the referer. Carry the selected locale explicitly, validate it against the installed locale allowlist during cart setup and in Eve's channel, and pass the validated commerce context to the direct Shopify tools and connections. Client context can describe the page, but must not select an arbitrary cart or an unsupported locale. Do not infer locale from URL segments or fall back unconditionally to `defaultLocale`.

Agent tools, Shopify connections, product context, cart creation, and navigation outputs must use that validated locale. Keep Next.js request and cache APIs in the storefront; Eve uses the shared uncached Shopify catalog operations and Hydrogen handlers.

### Markdown negotiation

Localized page routes carry an internal `/:locale/...` path after the rewrite, but markdown requests reach the unlocalized `app/md/...` handlers. Follow `enable-i18n` Step 9 for `getMarkdownPath()` and `getMarkdownMirrorPath()`, and in invisible-cookie mode resolve the locale from the validated cookie instead of a URL prefix. Preserve `?variant=` and search parameters.

## 8. Switch locale and carry the market to the cart

Cart writes stay in Hydrogen's `/api/cart` handler; never mutate the cart from a Server Action or a custom route. Because the proxy builds the handler's request context from the selected locale (Step 6), the next cart read or write after a switch runs in the new market:

- `fr-CA` to `en-CA`: copy and Shopify language change; the country stays `CA`.
- `en-CA` to `en-US`: the cart's next Hydrogen operation runs with country `US`.

Use Shopify AI Toolkit to confirm how the store's cart buyer country and pricing follow `@inContext` on cart operations. If the store requires an explicit buyer-country update, the installed Hydrogen SDK exposes no cart intent for it: report that gap instead of adding a cart mutation outside Hydrogen's handlers.

The selector remains a leaf Client Component. A Server Action in `lib/i18n/action.ts` parses the requested locale with a module-private `zod` schema that accepts only `isEnabledLocale` values, then sets the locale cookie; it never reads or writes the cart. After a country change, call `refresh()` from `useCartActions()` so prices and checkout reflect Shopify's response for the new market; do not invalidate public cache tags.

- **Sub-path/per-domain:** use next-intl's client router to replace the current pathname with `{ locale: nextLocale }`, then refresh the cart.
- **Invisible cookie:** call the action, then call `router.refresh()` and refresh the cart. The pathname must not change.

Do not offer a separate currency selector unless the store has a Shopify-backed currency choice independent of country. Display currency from cart/product responses.

## 9. Strategy-specific SEO and sitemap behavior

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

## 10. Verification

Run focused checks from the storefront root, then run the app and verify the selected strategy:

```bash
pnpm lint
pnpm build
```

### All strategies

- Every enabled regional locale produces the expected Shopify country/language context.
- Product and cart currency codes come from Shopify responses.
- Public caches separate localized products, prices, and menus; carts remain uncached.
- `fr-CA` to `en-CA` keeps Shopify country `CA` for the cart.
- `en-CA` to `en-US` refreshes the cart with Shopify's `US` context, and every cart write still goes through `/api/cart`.
- Chat/agent operations receive the explicit validated locale.
- Markdown responses use the same locale as HTML responses.
- Variant and filter query parameters survive switching and rewrites.
- Existing localized installations retain their translations, custom routing, and approved commerce model.

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
