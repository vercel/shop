"use client";

import type { I18nConfig } from "@shopify/hydrogen";
import { ShopifyScripts } from "@shopify/hydrogen/react";
import { useRouter } from "next/navigation";

import { shopConfig } from "@/lib/config";
import type { ShopAnalyticsData } from "@/lib/types";

interface ShopifyScriptsTrackerProps {
  shop: ShopAnalyticsData;
  storefrontId: string;
}

export function ShopifyScriptsTracker({ shop, storefrontId }: ShopifyScriptsTrackerProps) {
  const router = useRouter();

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
        i18n={
          {
            country: shop.country,
            currency: shop.currency,
            language: shop.acceptedLanguage,
          } as I18nConfig & { currency: string }
        }
        navigate={(url) => router.push(url)}
        shop={{
          shopId: shop.shopId,
          myshopifyDomain: shop.storeDomain,
          storefrontId,
        }}
        shopifyAnalytics={shopConfig.analytics.shopify.isEnabled}
        webMcp={shopConfig.webmcp.isEnabled}
      />
    </>
  );
}
