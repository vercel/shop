import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";

import { ShopifyAnalyticsClient } from "@/components/analytics-client";
import { getCurrencyCode, getLanguageCode } from "@/lib/i18n";
import { withFallback } from "@/lib/shopify/errors";
import { getShopId } from "@/lib/shopify/operations/shop";

export function AnalyticsComponents() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

async function ShopifyAnalyticsLoader({ locale }: { locale: string }) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return null;

  const shopId = await withFallback(getShopId(), undefined);
  if (!shopId) return null;

  return (
    <ShopifyAnalyticsClient
      consentDomain={domain}
      // The Storefront token is public (see lib/shopify/storefront.ts); the consent API requires it client-side.
      publicStorefrontAccessToken={token}
      shop={{
        acceptedLanguage: getLanguageCode(locale),
        currency: getCurrencyCode(locale),
        hydrogenSubchannelId: "0",
        shopId,
      }}
    />
  );
}

export function ShopifyAnalytics({ locale }: { locale: string }) {
  return (
    <Suspense>
      <ShopifyAnalyticsLoader locale={locale} />
    </Suspense>
  );
}
