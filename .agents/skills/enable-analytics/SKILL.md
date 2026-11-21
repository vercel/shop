---
name: enable-analytics
description: Enable Vercel Analytics, Vercel Speed Insights, or Google Tag Manager in a Vercel Shop storefront. Use when the user wants page views, Core Web Vitals, or GTM tracking, or asks to turn a storefront's analytics on or off.
---

# Enable Analytics

Vercel Web Analytics and Vercel Speed Insights ship installed and disabled: `analytics.vercel.isEnabled` and `analytics.speedInsights.isEnabled` in `lib/config/index.ts` are `false`, and `components/analytics/index.tsx` renders each provider only behind its flag. Enabling them is a config edit. Google Tag Manager needs a package, an environment variable, and one line in that component.

## Before you start

Ask two questions, then wait for both answers.

### 1. Vercel Analytics and/or Speed Insights?

Both, analytics only, Speed Insights only, or neither — leave both flags `false` for neither.

### 2. Google Tag Manager?

If yes, ask for the container ID (`GTM-XXXXXX`), stored in `NEXT_PUBLIC_GTM_ID`.

## Part A: Vercel Analytics and Speed Insights

Set the selected flags to `true` in `lib/config/index.ts`. Nothing else changes: both packages are dependencies, `components/analytics/index.tsx` gates each provider with `&&`, and `app/layout.tsx` already mounts `<AnalyticsComponents />`.

Only if the storefront lacks the integration, add the selected package with `pnpm add @vercel/analytics` and/or `pnpm add @vercel/speed-insights`, import from the `/next` subpath, and render it inside the existing gate in `components/analytics/index.tsx`.

## Part B: Google Tag Manager

Skip this section if the user did not want GTM.

1. Install the integration: `pnpm add @next/third-parties`.
2. Add this row to the `# Optional` block of `.env.example`, keeping it alphabetical:

   ```bash
   # NEXT_PUBLIC_GTM_ID="GTM-XXXXXX" # Set to load Google Tag Manager; leave unset to skip it.
   ```

3. Add `NEXT_PUBLIC_GTM_ID` to `globalEnv` in `turbo.json`, keeping it alphabetical; Turborepo's strict mode hides undeclared variables from tasks and leaves them out of cache keys.
4. In `components/analytics/index.tsx`, import `GoogleTagManager` from `@next/third-parties/google`, add `const gtmId = process.env.NEXT_PUBLIC_GTM_ID;` to `AnalyticsComponents`, and render `{gtmId && <GoogleTagManager gtmId={gtmId} />}` in the fragment beside the other providers.

Set the actual value in `.env.local` or in the Vercel dashboard under Environment Variables.

## Part C: Shopify analytics and consent

Only change these when the user asked about Shopify analytics or consent. `analytics.shopify.isEnabled` turns on Shopify's analytics destination and its consent integration, `analytics.shopify.consent.isEnabled` loads consent alone, and `shopify.webmcp.isEnabled` loads Shopify scripts and consent without the destination. `isShopifyScriptsEnabled` in `lib/config/index.ts` combines the three and gates `<ShopifyScriptsTracker>`, which needs the numeric `NEXT_PUBLIC_SHOPIFY_SHOP_ID` rather than the Headless storefront ID.

`analytics.shopify.consent.mode` defaults to `default-banner`, which renders Shopify's hosted banner for visitors in regions that require consent. Use `custom-banner` when the storefront supplies its own consent UI, and do not ship `no-banner` unless consent is handled elsewhere: visitors in those regions can never grant it, so their events are dropped.

Third-party analytics subscribe through the same destination API, so consent gating and buffered replay stay centralized. Register destinations with `addAnalyticsDestination()` from `lib/analytics/client.ts`; do not publish cart-change events manually.

## Guardrails

- Keep providers and their gates in `components/analytics/index.tsx`, and keep it mounted from the root layout even with every provider disabled. Never add a sibling `components/analytics.tsx`, which would shadow the directory import.
- Read the container ID from `NEXT_PUBLIC_GTM_ID`; never hardcode it or use a manual `<script>` tag.
- Do not add next-intl or a root message catalog for analytics, and do not pass a complete catalog to a root `NextIntlClientProvider` in a localized storefront.
