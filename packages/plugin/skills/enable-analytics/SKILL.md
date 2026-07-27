---
name: enable-analytics
description: Add Vercel Analytics, Vercel Speed Insights, and Google Tag Manager to the storefront.
---

# Enable Analytics

The current storefront includes support for Vercel Web Analytics and Vercel Speed Insights, with each integration disabled by default in `shop.config.ts`. This skill enables or adds those integrations and can also add Google Tag Manager using the recommended integration.

## Before you start

Ask the user two questions in order:

### 1. Do you need to add or change Vercel Analytics and/or Vercel Speed Insights?

- **Enable both** — page views, custom events, and Core Web Vitals
- **Analytics only** — page view and custom event tracking via `@vercel/analytics`
- **Speed Insights only** — Core Web Vitals monitoring via `@vercel/speed-insights`
- **Neither** — keep both integrations disabled

### 2. Do you want Google Tag Manager?

If yes, ask for the GTM container ID (e.g. `GTM-XXXXXX`). This will be stored in the `NEXT_PUBLIC_GTM_ID` environment variable.

Wait for the user to answer both questions before proceeding.

---

## Part A: Vercel Analytics and Speed Insights

If the storefront has `analytics` configuration in `shop.config.ts`, enable only the selected integrations. If the user selected neither, keep both integration gates disabled and skip the remaining steps in this section.

```ts
analytics: {
  shopify: { consentMode: shopifyConsentMode, enabled: isDevelopment },
  speedInsights: { enabled: false },
  vercel: { enabled: false },
},
```

The `shopify` gate is separate: it controls Shopify storefront analytics, which the storefront already ships. Leave it alone unless the user asked about Shopify analytics, and see Part D.

### A1. Install dependencies

For older storefronts without the integrations, install only the packages the user selected:

```bash
# Both
pnpm add @vercel/analytics @vercel/speed-insights

# Analytics only
pnpm add @vercel/analytics

# Speed Insights only
pnpm add @vercel/speed-insights
```

For older storefronts, create or update the root analytics component described below. Each library handles its own client-side behavior internally.

---

## Part B: Google Tag Manager

Skip this section if the user did not want GTM.

### B1. Install dependency

```bash
pnpm add @next/third-parties
```

### B2. Add environment variable

Add to `.env.example`:

```
# Google Tag Manager (optional)
NEXT_PUBLIC_GTM_ID="GTM-XXXXXX"
```

Set the actual value in `.env.local` or in the Vercel dashboard under Environment Variables.

### B3. Add GTM to `components/analytics.tsx`

Import `GoogleTagManager` from `@next/third-parties/google`. Read `NEXT_PUBLIC_GTM_ID` in the analytics component and render `<GoogleTagManager gtmId={gtmId} />` only when the value exists. If the storefront extends `shop.config.ts` with a GTM integration gate, apply that gate inside the same component.

---

## Part C: Root analytics integration

### C1. Create or update `components/analytics.tsx`

Compose the selected providers in the root analytics component and apply each integration gate there:

```tsx
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { shopConfig } from "@/shop.config";

export function AnalyticsComponents() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <>
      {shopConfig.analytics.vercel.enabled ? <Analytics /> : null}
      {shopConfig.analytics.speedInsights.enabled ? <SpeedInsights /> : null}
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
    </>
  );
}
```

Remove imports for integrations the storefront does not support.

### C2. Update `app/layout.tsx`

Always render the root analytics component inside `<body>` after the `</NextIntlClientProvider>` closing tag:

```tsx
import { AnalyticsComponents } from "@/components/analytics";
```

```tsx
<body ...>
  <a href="#main-content" ...>...</a>
  <SiteSchema locale={locale} />
  <NextIntlClientProvider locale={locale} messages={messages}>
    {/* ... existing layout content ... */}
  </NextIntlClientProvider>
  <AnalyticsComponents />
</body>
```

The root component remains mounted as the extension point for current and future analytics providers. Provider gates stay inside it so disabled integrations are not mounted.

## Part D: Shopify storefront analytics

Only make changes here if the user asked about Shopify analytics.

The storefront sends page views to Shopify analytics through Hydrogen's analytics bus. It is on in development and off in production. To enable it for a deployment, set `NEXT_PUBLIC_ENABLE_SHOPIFY_ANALYTICS="1"`.

Consent mode is set by `NEXT_PUBLIC_SHOPIFY_CONSENT_MODE` and defaults to `no-banner` in development and `default-banner` in production. `default-banner` renders Shopify's hosted privacy banner for visitors in regions that require consent. Use `custom-banner` when the storefront supplies its own consent UI. Do not ship `no-banner` in production unless consent is handled elsewhere, because visitors in those regions can never grant consent and their events are dropped.

This integration covers page views only. Commerce events such as product views and cart activity are not wired up.

## Guardrails

- Keep root analytics providers and their gates in `components/analytics.tsx`.
- Always mount `<AnalyticsComponents />` from the root layout, even when every provider is disabled.
- The GTM container ID must come from `NEXT_PUBLIC_GTM_ID`, never hardcoded. The provider renders nothing if the env var is missing.
- Use `@next/third-parties/google` for GTM, not a manual `<script>` tag. The Next.js component handles script loading and performance optimization.
- Import paths: use `@vercel/analytics/next` and `@vercel/speed-insights/next` (the `/next` subpath), not the root package exports.
- Add `NEXT_PUBLIC_GTM_ID` to `.env.example` with a placeholder value so other developers know the variable exists.
