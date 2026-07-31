"use client";

import type { I18nConfig } from "@shopify/hydrogen";
import { ShopifyScripts } from "@shopify/hydrogen/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { shopConfig } from "@/lib/config";
import type { ShopAnalyticsData } from "@/lib/types";

interface ShopifyAnalyticsTrackerProps {
  shop: ShopAnalyticsData;
}

export function ShopifyAnalyticsTracker({ shop }: ShopifyAnalyticsTrackerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageKey = `${pathname}?${searchParams.toString()}`;

  const isFirstRender = useRef(true);

  useEffect(() => {
    // The CDN script tracks the initial page view on load; only publish SPA navigations.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.Shopify?.analytics?.publish("page_viewed", { url: window.location.href });
  }, [pageKey]);

  return (
    <>
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
          // Headless channel omits storefrontId from the analytics config; the
          // Storefront API does not expose one, so perf-kit is not loaded here.
          storefrontId: "",
        }}
      />
      <script
        // The hydrogen bootstrap hardcodes consentDomain to window.location.host, which
        // 404s on the deployment origin. Point the consent API at the shop domain instead.
        dangerouslySetInnerHTML={{
          __html: `if (window.Shopify?.customerPrivacy) { window.Shopify.customerPrivacy.config.consentDomain = ${JSON.stringify(shop.storeDomain)}; }`,
        }}
        id="shopify-consent-domain-override"
      />
    </>
  );
}
