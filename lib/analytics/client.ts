"use client";

import {
  AnalyticsEvent,
  type StorefrontAnalytics,
  type StorefrontAnalyticsDestination,
} from "@shopify/hydrogen";

export { AnalyticsEvent };

let analytics: StorefrontAnalytics | null = null;

export function addAnalyticsDestination(destination: StorefrontAnalyticsDestination): () => void {
  return getAnalytics()?.addDestination(destination) ?? (() => {});
}

export function getAnalytics(): StorefrontAnalytics | null {
  if (typeof window === "undefined") return null;
  if (analytics) return analytics;
  analytics = window.Shopify?.analytics ?? null;
  return analytics;
}
