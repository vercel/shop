"use client";

import type { ShopifyScriptsI18n, ShopifyScriptsShop } from "@shopify/hydrogen";
import { ShopifyScripts, useCartAnalytics } from "@shopify/hydrogen/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { PageViewedTracker } from "@/components/analytics/trackers";
import { shopConfig } from "@/lib/config";
import type { ShopAnalyticsData } from "@/lib/types";

interface ShopifyScriptsTrackerProps {
  shop: ShopAnalyticsData;
  storefrontId: string;
}

function AnalyticsReady({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => setIsReady(true), []);
  return isReady ? children : null;
}

function CartAnalyticsTracker() {
  useCartAnalytics();
  return null;
}

export function ShopifyScriptsTracker({ shop, storefrontId }: ShopifyScriptsTrackerProps) {
  const router = useRouter();
  const i18n: ShopifyScriptsI18n = {
    country: shop.country,
    currency: shop.currency,
    language: shop.acceptedLanguage,
  };
  const shopifyShop: ShopifyScriptsShop = {
    myshopifyDomain: shop.storeDomain,
    shopId: shop.shopId,
    storefrontId,
  };

  return (
    <>
      {/* Shopify's hosted privacy banner still reads the Liquid token fallback in headless stores. */}
      <script id="shopify-features" type="application/json">
        {JSON.stringify({
          accessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        })}
      </script>
      <ShopifyScripts
        analytics={{ channel: "headless" }}
        consent={{ mode: shopConfig.analytics.shopify.consentMode }}
        i18n={i18n}
        navigate={(url) => router.push(url)}
        shop={shopifyShop}
        shopifyAnalytics={shopConfig.analytics.shopify.isEnabled}
        webMcp={shopConfig.webmcp.isEnabled}
      />
      <AnalyticsReady>
        <PageViewedTracker />
        <CartAnalyticsTracker />
      </AnalyticsReady>
    </>
  );
}
