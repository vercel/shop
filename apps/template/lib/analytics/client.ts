"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import type { ShopAnalyticsData } from "@/lib/types";

import { AnalyticsEvent, configureAnalytics, getAnalytics } from "./index";

export function useShopifyPageView(shop: ShopAnalyticsData): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    configureAnalytics(shop);
    getAnalytics()?.publish(AnalyticsEvent.PAGE_VIEWED);
  }, [pageKey, shop]);
}
