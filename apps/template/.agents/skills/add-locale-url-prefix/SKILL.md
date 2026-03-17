---
name: add-locale-url-prefix
description: Restore locale-prefixed URLs and next-intl routing in the shop template.
---

# Add Locale URL Prefix

Restore locale-prefixed URLs (e.g., `/en-US/products/foo`) to this codebase. This was removed in favor of clean URLs (`/products/foo`) with locale hardcoded to `en-US`.

## What Was Removed

### 1. Route Segment: `app/[locale]/`

All page routes lived under `app/[locale]/` as a dynamic segment:

```
app/[locale]/layout.tsx
app/[locale]/page.tsx
app/[locale]/products/[handle]/page.tsx
app/[locale]/collections/[handle]/page.tsx
...
```

Pages used `PageProps<"/[locale]/products/[handle]">` and `LayoutProps<"/[locale]">` types. The root layout had `generateStaticParams` returning all locales:

```ts
export const generateStaticParams = async () => {
  return locales.map((locale) => ({ locale }));
};
```

### 2. `proxy.ts` — Locale Middleware

The middleware used `next-intl/middleware` to handle locale detection, redirects, and rewrites:

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

const handlei18n = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Content negotiation for markdown (product pages)
  // ...

  // Normal flow: i18n handling and routing
  let response = handlei18n(request);
  if (response.ok) {
    const url = new URL(response.headers.get("x-middleware-rewrite") || request.url);
    const [, locale, ...rest] = url.pathname.split("/");
    const rewriteUrl = new URL(`/${[locale, ...rest].filter(Boolean).join("/")}`, request.url);
    rewriteUrl.search = url.search;
    response = NextResponse.rewrite(rewriteUrl, { headers: response.headers });
  }
  return response;
}
```

### 3. `lib/i18n/routing.ts`

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en-US", "en-GB", "de-DE", "fr-FR", "nl-NL", "es-ES"],
  defaultLocale: "en-US",
  localePrefix: "always",
});
```

### 4. `lib/i18n/navigation.ts`

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

Components imported `Link` from `@/lib/i18n/navigation` instead of `next/link`. The locale-aware `Link` automatically prefixed URLs with the current locale. `useRouter` supported `router.replace(pathname, { locale })` for locale switching.

### 5. `lib/params.ts` — getLocale()

Used `next/root-params` to extract locale from the `[locale]` dynamic segment:

```ts
import { locale } from "next/root-params";
export async function getLocale(): Promise<Locale> {
  const currentLocale = await locale();
  if (!currentLocale || !locales.includes(currentLocale)) notFound();
  return currentLocale;
}
```

### 6. `lib/i18n/request.ts`

Loaded messages based on the current locale from params:

```ts
const requested = await getLocale();
const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
const language = locale.split("-")[0];
let messages;
try {
  messages = (await import(`./messages/${locale}.json`)).default;
} catch {
  messages = (await import(`./messages/${language}.json`)).default;
}
return { locale, messages };
```

### 7. `lib/seo.ts` — withLocalePath()

```ts
function withLocalePath(locale: string, pathname: string): string {
  const normalizedPath = normalizePath(pathname);
  if (normalizedPath === "/") return `/${locale}`;
  return `/${locale}${normalizedPath}`;
}
```

`buildAlternates()` generated per-locale canonical URLs and language alternates using this function.

### 8. URL Construction in Components

Components used `/${locale}/...` template literals:

- `/${locale}/search?q=...`
- `/${locale}/products/${handle}`
- `/${locale}/collections/${handle}`
- `/${locale}/cart`

### 9. `app/sitemap.ts`

Had `localizePath()` function and generated per-locale URLs for every page (6 entries per page instead of 1).

### 10. `next.config.ts` Redirects

Had locale-prefixed redirect rules:

```ts
{ source: "/:locale/product", destination: "/:locale/products", permanent: true },
{ source: "/:locale/product/:path*", destination: "/:locale/products/:path*", permanent: true },
```

### 11. `app/(unlocalized)/page.tsx`

Fallback redirect for requests without locale prefix:

```ts
permanentRedirect(`/${locales[0]}`);
```

## Step-by-Step Restoration Guide

### Step 1: Recreate routing and navigation files

Create `lib/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en-US", "en-GB", "de-DE", "fr-FR", "nl-NL", "es-ES"],
  defaultLocale: "en-US",
  localePrefix: "always",
});
```

Create `lib/i18n/navigation.ts`:

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

### Step 2: Move route files back under `app/[locale]/`

Move all routes from `app/` to `app/[locale]/`:

- `app/layout.tsx` → `app/[locale]/layout.tsx`
- `app/page.tsx` → `app/[locale]/page.tsx`
- `app/error.tsx` → `app/[locale]/error.tsx`
- `app/not-found.tsx` → `app/[locale]/not-found.tsx`
- `app/cart/` → `app/[locale]/cart/`
- etc.

Update all `PageProps<"/...">` → `PageProps<"/[locale]/...">`.

### Step 3: Restore `lib/params.ts`

```ts
import { notFound } from "next/navigation";
import { locale } from "next/root-params";
import { type Locale, locales } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const currentLocale = await locale();
  if (!currentLocale || !locales.includes(currentLocale)) notFound();
  return currentLocale;
}
```

### Step 4: Restore `lib/i18n/request.ts`

```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { getLocale } from "../params";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  const requested = await getLocale();
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const language = locale.split("-")[0];
  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`./messages/${language}.json`)).default;
  }
  return { locale, messages };
});
```

### Step 5: Restore `proxy.ts`

Bring back full next-intl middleware with locale routing. See original code in this document.

### Step 6: Update component URL patterns

Replace all `/products/...`, `/collections/...`, `/search?q=...` patterns with `/${locale}/...` equivalents. Replace `next/link` imports with `@/lib/i18n/navigation` imports where locale-aware linking is needed.

### Step 7: Restore SEO functions

Add back `withLocalePath()` to `lib/seo.ts` and update `buildAlternates()` to generate per-locale alternates.

### Step 8: Restore sitemap

Add back `localizePath()` and per-locale URL generation in `app/sitemap.ts`.

### Step 9: Restore locale-prefixed redirects in `next.config.ts`

### Step 10: Recreate `app/(unlocalized)/page.tsx` fallback

### Step 11: Add `generateStaticParams` to root layout

```ts
export const generateStaticParams = async () => {
  return locales.map((locale) => ({ locale }));
};
```

### Step 12: Re-enable the Locale & Currency Selector in the Megamenu

The browse menu previously included a `LocaleCurrencySelector` that let users switch language and see their currency. It was removed when locale URL prefixes were removed (since there's only one locale without them). To restore it:

1. The component already exists at `components/layout/nav/locale-currency.tsx` (with a fallback at `locale-currency-fallback.tsx`).

2. Add it back to `components/layout/nav/megamenu/index.tsx`:

```tsx
import { LocaleCurrencySelector } from "../locale-currency";

// In MegamenuContent, pass as children to both desktop and mobile:
<MegamenuDesktop locale={locale} items={data.items}>
  <LocaleCurrencySelector locale={locale} />
</MegamenuDesktop>

<MegamenuMobile data={data} locale={locale}>
  <ShippingAddress className="flex items-center" />
  <LocaleCurrencySelector locale={locale} />
</MegamenuMobile>
```

3. The selector renders at the bottom of the megamenu nav column (in a `border-t` footer area) on both desktop and mobile. It uses `syncCartLocaleAction` to update the cart's country/currency when the user switches locale.

4. The `account/currency-selector.tsx` compound component also exists for use in account settings pages if needed.
