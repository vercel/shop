"use client";

import type { ShopifyScriptsI18n, ShopifyScriptsShop } from "@shopify/hydrogen";
import { ShopifyScripts, useCartAnalytics } from "@shopify/hydrogen/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useSyncExternalStore } from "react";

import { PageViewedTracker } from "@/components/analytics/trackers";
import { shopConfig } from "@/lib/config";
import { SHOPIFY_ROUTE_TEMPLATES } from "@/lib/shopify/routing";

interface ShopifyScriptsTrackerProps {
  i18n: ShopifyScriptsI18n;
  shop: ShopifyScriptsShop;
}

const subscribeNoop = () => () => {};

// Trackers must mount after hydration so the analytics bus script has run.
function AnalyticsReady({ children }: { children: ReactNode }) {
  const isHydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  return isHydrated ? children : null;
}

function CartAnalyticsTracker() {
  useCartAnalytics();
  return null;
}

export function ShopifyScriptsTracker({ i18n, shop }: ShopifyScriptsTrackerProps) {
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
        consent={{ mode: shopConfig.analytics.shopify.consent.mode }}
        i18n={i18n}
        navigate={(url) => router.push(url)}
        routes={SHOPIFY_ROUTE_TEMPLATES}
        shop={shop}
        shopifyAnalytics={shopConfig.analytics.shopify.isEnabled}
        webMcp={shopConfig.shopify.webmcp.isEnabled}
      />
      <AnalyticsReady>
        <PageViewedTracker />
        <CartAnalyticsTracker />
      </AnalyticsReady>
    </>
  );
}
