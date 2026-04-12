---
name: enable-analytics
description: Add Vercel Analytics, Vercel Speed Insights, and Google Tag Manager to the storefront.
---

# Enable Analytics

By default, the storefront has no analytics or performance monitoring. This skill adds Vercel Analytics, Vercel Speed Insights, and/or Google Tag Manager using their recommended integrations.

## Before you start

Ask the user two questions in order:

### 1. Do you want Vercel Analytics and/or Vercel Speed Insights?

- **Vercel Analytics** — page view and custom event tracking via `@vercel/analytics`
- **Vercel Speed Insights** — Core Web Vitals monitoring via `@vercel/speed-insights`
- **Both** (recommended)
- **Neither**

### 2. Do you want Google Tag Manager?

If yes, ask for the GTM container ID (e.g. `GTM-XXXXXX`). This will be stored in the `NEXT_PUBLIC_GTM_ID` environment variable.

Wait for the user to answer both questions before proceeding.

---

## Part A: Vercel Analytics and Speed Insights

Skip this section if the user selected neither.

### A1. Install dependencies

Install only the packages the user selected:

```bash
# Both (recommended)
pnpm add @vercel/analytics @vercel/speed-insights

# Analytics only
pnpm add @vercel/analytics

# Speed Insights only
pnpm add @vercel/speed-insights
```

### A2. Create `components/analytics.tsx`

Create a component that renders the selected analytics components. This is a client component because both libraries need browser APIs:

```tsx
"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function AnalyticsComponents() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

If only one was selected, remove the other import and component.

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

If the file was already created in Part A, add GTM to it. If Part A was skipped, create the file now.

With both Vercel Analytics and GTM:

```tsx
"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function AnalyticsComponents() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
    </>
  );
}
```

With GTM only (no Vercel Analytics or Speed Insights):

```tsx
"use client";

import { GoogleTagManager } from "@next/third-parties/google";

export function AnalyticsComponents() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  if (!gtmId) return null;

  return <GoogleTagManager gtmId={gtmId} />;
}
```

---

## Part C: Root layout integration

### C1. Update `app/layout.tsx`

Import the component and render it inside `<body>`, after the `</NextIntlClientProvider>` closing tag:

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

Place `<AnalyticsComponents />` as a sibling after `NextIntlClientProvider`, not inside it. Analytics components do not need i18n context.

## Guardrails

- All analytics components live in a single `components/analytics.tsx` file. Do not scatter them across the layout.
- The GTM container ID must come from `NEXT_PUBLIC_GTM_ID`, never hardcoded. The component renders nothing if the env var is missing.
- Use `@next/third-parties/google` for GTM, not a manual `<script>` tag. The Next.js component handles script loading and performance optimization.
- Import paths: use `@vercel/analytics/next` and `@vercel/speed-insights/next` (the `/next` subpath), not the root package exports.
- Add `NEXT_PUBLIC_GTM_ID` to `.env.example` with a placeholder value so other developers know the variable exists.
